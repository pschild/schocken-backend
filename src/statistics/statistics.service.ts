import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { groupBy, maxBy, orderBy, sumBy } from 'lodash';
import { Between, DataSource, In, Not, Repository } from 'typeorm';
import { memoizeAsync } from 'utils-decorators';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeTrigger } from '../event-type/enum/event-type-trigger.enum';
import { EventPenaltyDto } from '../event/dto/event-penalty.dto';
import { PlaceType } from '../game/enum/place-type.enum';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PenaltyDto } from '../penalty/dto/penalty.dto';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { addPenalties, penaltySumByUnit, summarizePenalties } from '../penalty/penalty.utils';
import { calculateMaxStreak } from './streak/streak.utils';

const CACHE_TTL = 1000 * 60 * 60;

/**
 * Wrapper decorator for @memoizeAsync to disable caching during tests.
 */
export const Cached = (ms: number) => {
  return process.env.NODE_ENV === 'test' ? () => {} : memoizeAsync(ms);
};

@Injectable(/*{ scope: Scope.REQUEST }*/)
export class StatisticsService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @InjectRepository(Round) private readonly roundRepo: Repository<Round>,
    @InjectRepository(EventType) private readonly eventTypeRepo: Repository<EventType>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
  ) {
  }

  // level 0
  @Cached(CACHE_TTL)
  async games(fromDate: Date, toDate: Date): Promise<{ id: string; datetime: Date; }[]> {
    return this.gameRepo.find({ select: ['id', 'datetime'], where: { datetime: Between(fromDate, toDate), excludeFromStatistics: false }, order: { datetime: 'ASC' } });
  }

  // level 0
  @Cached(CACHE_TTL)
  async gameIds(fromDate: Date, toDate: Date): Promise<string[]> {
    return (await this.games(fromDate, toDate)).map(({ id }) => id);
  }

  // level 0
  @Cached(CACHE_TTL)
  async eventTypes(): Promise<{ id: string; description: string; context: EventTypeContext; trigger: EventTypeTrigger; penaltyValue: number; }[]> {
    return this.eventTypeRepo.find({ select: ['id', 'description', 'context', 'trigger', 'penaltyValue'], withDeleted: true });
  }

  // level 0
  @Cached(CACHE_TTL)
  async getRoundEventTypeIdsWithPenalty(): Promise<string[]> {
    return (await this.eventTypes())
      .filter(type => type.context === EventTypeContext.ROUND && !!type.penaltyValue)
      .map(({ id }) => id);
  }

  // level 0
  @Cached(CACHE_TTL)
  async players(onlyActive: boolean): Promise<{ id: string; name: string; }[]> {
    return this.playerRepo.find({ select: ['id', 'name'], where: { ...(onlyActive ? { active: true } : {}), }, withDeleted: !onlyActive });
  }

  // level 0
  @Cached(CACHE_TTL)
  async playerIds(onlyActive: boolean): Promise<string[]> {
    return (await this.players(onlyActive)).map(({ id }) => id);
  }

  // level 0
  @Cached(CACHE_TTL)
  async rounds(gameIds: string[]): Promise<{ id: string; datetime: Date; }[]> {
    return this.roundRepo.find({ select: ['id', 'datetime'], where: { game: { id: In(gameIds) } }, order: { datetime: 'ASC' } });
  }

  // level 0
  @Cached(CACHE_TTL)
  async roundIds(gameIds: string[]): Promise<string[]> {
    return (await this.rounds(gameIds)).map(({ id }) => id);
  }

  // level 0
  @Cached(CACHE_TTL)
  async gamesWithRoundsAndEvents(gameIds: string[], playerIds: string[]): Promise<{ id: string; datetime: Date; rounds: Round[]; events: Event[] }[]> {
    const result = await this.gameRepo.find({
      where: { id: In(gameIds) },
      select: {
        id: true,
        datetime: true,
        rounds: {
          id: true,
          datetime: true,
          events: {
            penaltyValue: true,
            penaltyUnit: true,
            multiplicatorValue: true,
            player: {
              id: true
            }
          }
        },
        events: {
          penaltyValue: true,
          penaltyUnit: true,
          multiplicatorValue: true,
          player: {
            id: true
          }
        }
      },
      relations: ['rounds', 'events', 'rounds.events', 'events.player', 'rounds.events.player']
    });

    // Filtering in SQL too complicated at the moment...
    return result.map(game => ({
      ...game,
      events: game.events.filter(e => playerIds.includes(e.player.id)),
      rounds: game.rounds.map(round => ({
        ...round,
        events: round.events.filter(e => playerIds.includes(e.player.id))
      }))
    }));
  }

  // level 0
  @Cached(CACHE_TTL)
  async attendancesByPlayerId(gameIds: string[], playerIds: string[]): Promise<{ count: string; playerId: string; }[]> {
    const roundIds = await this.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.dataSource.query(`
        SELECT count(*), "playerId"
        FROM attendances
        WHERE "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        GROUP BY "playerId"
    `);
  }

  // level 0
  @Cached(CACHE_TTL)
  async getOrderedRoundIdsByPlayerId(gameIds: string[], playerId: string): Promise<string[]> {
    const roundIds = await this.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0 || !playerId) {
      return Promise.resolve([]);
    }

    const result = await this.dataSource.query(`
        SELECT id
        FROM round
        LEFT JOIN attendances ON round.id = attendances."roundId"
        WHERE "playerId" = '${playerId}'
        AND id IN (${roundIds.map(id => `'${id}'`).join(',')})
        ORDER BY datetime;
    `);
    return result.map(({ id }) => id);
  }

  // level 0
  @Cached(CACHE_TTL)
  async getRoundIdsByPlayerAndEventType(gameIds: string[], eventTypeId: string, playerId: string, mode: 'WITH_EVENT' | 'WITHOUT_EVENT'): Promise<string[]> {
    const roundIds = await this.roundIds(gameIds);

    const result = await this.dataSource.query(`
        SELECT "roundId"
        FROM attendances
        LEFT JOIN round ON attendances."roundId" = round.id
        WHERE "playerId" = '${playerId}'
        AND "roundId" ${mode === 'WITH_EVENT' ? '' : 'NOT'} IN (
            SELECT "roundId"
            FROM event
            WHERE "playerId" = '${playerId}'
            AND "eventTypeId" = '${eventTypeId}'
        )
        AND "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
        ORDER BY round.datetime;
    `);
    return result.map(({ roundId }) => roundId);
  }

  // level 0
  @Cached(CACHE_TTL)
  async getRoundIdsByPlayerAndAnyPenalty(gameIds: string[], playerId: string, mode: 'NO_PENALTY' | 'AT_LEAST_ONE_PENALTY'): Promise<string[]> {
    const roundIds = await this.roundIds(gameIds);
    const eventTypeIdsWithPenalty = await this.getRoundEventTypeIdsWithPenalty();

    const result = await this.dataSource.query(`
        SELECT "roundId"
        FROM attendances
        LEFT JOIN round ON attendances."roundId" = round.id
        WHERE "playerId" = '${playerId}'
        AND "roundId" ${mode === 'AT_LEAST_ONE_PENALTY' ? '' : 'NOT'} IN (
            SELECT "roundId"
            FROM event
            WHERE "playerId" = '${playerId}'
            AND "eventTypeId" IN (${eventTypeIdsWithPenalty.map(id => `'${id}'`).join(',')})
        )
        AND "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
        ORDER BY round.datetime;
    `);
    return result.map(({ roundId }) => roundId);
  }

  // level 0
  @Cached(CACHE_TTL)
  async maxEventCounts(gameIds: string[], playerIds: string[]): Promise<{ count: string; eventTypeId: string; gameId: string; playerId: string; }[]> {
    if (gameIds.length === 0 || playerIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.dataSource.query(`
        SELECT count, "eventTypeId", "gameId", "playerId" FROM (
            SELECT *, RANK() OVER (PARTITION BY "eventTypeId" ORDER BY count DESC) as rnk
            FROM (
               SELECT COUNT(*) count, "eventTypeId", round."gameId", "playerId"
               FROM event
               LEFT JOIN round ON event."roundId" = round.id
               WHERE "roundId" IS NOT NULL
               AND round."gameId" IN (${gameIds.map(id => `'${id}'`).join(',')})
               AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
               GROUP BY round."gameId", "eventTypeId", "playerId"
               ORDER BY count DESC
           ) t
        ) s
        WHERE rnk = 1;
    `);
  }

  // level 1
  @Cached(CACHE_TTL)
  async gamesWithPenalties(gameIds: string[], playerIds: string[]): Promise<{ id: string; datetime: Date; gamePenalties: PenaltyDto[]; roundPenalties: PenaltyDto[]; combinedPenalties: PenaltyDto[]; roundAverage: number; }[]> {
    const games = await this.gamesWithRoundsAndEvents(gameIds, playerIds);
    return games
      .map(game => {
        const gamePenalties = summarizePenalties(EventPenaltyDto.fromEntities(game.events));
        const roundPenalties = summarizePenalties(EventPenaltyDto.fromEntities(game.rounds.map(round => round.events).flat()));
        const combinedPenalties = addPenalties(gamePenalties, roundPenalties);

        return {
          id: game.id,
          datetime: game.datetime,
          gamePenalties,
          roundPenalties,
          combinedPenalties,
          roundAverage: game.rounds.length > 0 ? penaltySumByUnit(roundPenalties, PenaltyUnit.EURO) / game.rounds.length : 0
        };
      });
  }

  // level 1
  @Cached(CACHE_TTL)
  async roundsWithPenalties(gameIds: string[], playerIds: string[]): Promise<{ id: string; sum: number }[]> {
    const games = await this.gamesWithRoundsAndEvents(gameIds, playerIds);
    return games
      .map(game => game.rounds)
      .flat()
      .map(round => {
        const penalties = summarizePenalties(EventPenaltyDto.fromEntities(round.events));
        return {
          id: round.id,
          datetime: round.datetime,
          sum: penaltySumByUnit(penalties, PenaltyUnit.EURO)
        };
      });
  }

  // level 1
  @Cached(CACHE_TTL)
  async penaltySum({ fromDate, toDate, onlyActivePlayers }): Promise<PenaltyDto[]> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);

    return (await this.gamesWithPenalties(gameIds, playerIds))
      .map(({ combinedPenalties }) => combinedPenalties)
      .reduce((prev, curr) => addPenalties(prev, curr), []);
  }

  // level 1
  async countRounds({ fromDate, toDate }): Promise<number> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const roundIds = await this.roundIds(gameIds);

    return roundIds.length;
  }

  // level -1
  async attendancesTable({ fromDate, toDate, onlyActivePlayers }): Promise<{ id: string; name: string; count: number; quote: number }[]> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);

    const roundCount = await this.countRounds({ fromDate, toDate });
    const attendances = await this.attendancesByPlayerId(gameIds, playerIds);
    return attendances.map(playerInfo => ({
      id: playerInfo.playerId,
      name: this.findPropertyById(players, playerInfo.playerId, 'name'),
      count: +playerInfo.count,
      quote: +playerInfo.count / roundCount
    }));
  }

  // level -1
  async hostsTable({ fromDate, toDate, onlyActivePlayers }): Promise<{ count: string; hostedById: string | null; placeType: PlaceType; }[]> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);

    const result = await this.gameRepo
      .createQueryBuilder()
      .select(['count(*)', '"hostedById"', '"placeType"'])
      .where({ id: In(gameIds) })
      .andWhere([ { hostedBy: { id: In(playerIds) } }, { placeType: Not(PlaceType.HOME) } ])
      .groupBy('"hostedById"')
      .addGroupBy('"placeType"')
      .getRawMany();

    return result.map(entry => ({
      ...entry,
      ...(entry.placeType === PlaceType.HOME ? { name: this.findPropertyById(players, entry.hostedById, 'name') } : {})
    }));
  }

  // level -1
  async averageRoundsPerGame({ fromDate, toDate }): Promise<number> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const roundsIds = await this.roundIds(gameIds);

    return (roundsIds.length / gameIds.length) || undefined;
  }

  // level -1
  async countGames({ fromDate, toDate }): Promise<number> {
    const gameIds = await this.gameIds(fromDate, toDate);

    return gameIds.length;
  }

  // level -1
  async euroPerGame({ fromDate, toDate, onlyActivePlayers }): Promise<number> {
    const gameIds = await this.gameIds(fromDate, toDate);

    const penalties = await this.penaltySum({ fromDate, toDate, onlyActivePlayers });
    return (penaltySumByUnit(penalties, PenaltyUnit.EURO) / gameIds.length) || undefined;
  }

  // level -1
  async euroPerRound({ fromDate, toDate, onlyActivePlayers }): Promise<number> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const roundIds = await this.roundIds(gameIds);

    const roundPenalties = await this.roundsWithPenalties(gameIds, playerIds);
    const sum = sumBy(roundPenalties, item => item.sum);
    return (sum / roundIds.length) || undefined;
  }

  // level -1
  async mostExpensiveGame({ fromDate, toDate, onlyActivePlayers }): Promise<{ id: string; sum: number; }> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);

    // oldest (first) record wins!
    return maxBy(
      (await this.gamesWithPenalties(gameIds, playerIds)).map(result => ({ id: result.id, datetime: result.datetime, roundAverage: result.roundAverage, sum: penaltySumByUnit(result.combinedPenalties, PenaltyUnit.EURO) })),
      item => item.sum
    );
  }

  // level -1
  async mostExpensiveRoundAveragePerGame({ fromDate, toDate, onlyActivePlayers }): Promise<{ id: string; roundAverage: number; }> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);

    // oldest (first) record wins!
    return maxBy(
      (await this.gamesWithPenalties(gameIds, playerIds)).map(result => ({ id: result.id, datetime: result.datetime, roundAverage: result.roundAverage })),
      item => item.roundAverage
    );
  }

  // level -1
  async mostExpensiveRound({ fromDate, toDate, onlyActivePlayers }): Promise<{ id: string; sum: number; }> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);

    // oldest (first) record wins!
    return maxBy(await this.roundsWithPenalties(gameIds, playerIds), item => item.sum);
  }

  // level -1
  async recordsPerGame({ fromDate, toDate, onlyActivePlayers }): Promise<{ eventTypeId: string; description: string; records: { count: number; name: string; gameId: string; datetime: string }[] }[]> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);
    const eventTypes = await this.eventTypes();
    const games = await this.games(fromDate, toDate);

    const maxEventCounts = await this.maxEventCounts(gameIds, playerIds);
    return Object.keys(EventTypeTrigger)
      .map(key => {
        const eventTypeId = eventTypes.find(t => t.trigger === key)?.id;
        return {
          eventTypeId,
          description: this.findPropertyById(eventTypes, eventTypeId, 'description'),
          records: maxEventCounts.filter(i => i.eventTypeId === eventTypeId),
        };
      })
      .map(item => {
        return {
          ...item,
          records: item.records.map(({ count, gameId, playerId }) => {
            return {
              count: +count,
              gameId,
              name: this.findPropertyById(players, playerId, 'name'),
              datetime: this.findPropertyById(games, gameId, 'datetime'),
            };
          })
        };
      });
  }

  // level -1
  async eventTypeStreaks({ fromDate, toDate, onlyActivePlayers }, mode: 'WITH_EVENT' | 'WITHOUT_EVENT'): Promise<{ eventTypeId: string; description: string; mode: 'WITH_EVENT' | 'WITHOUT_EVENT'; streaks: { eventTypeId: string; name: string; streak: number; isCurrent: boolean; lastRoundIdOfStreak: string; datetime: string; }[] }[]> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);
    const eventTypes = await this.eventTypes();
    const rounds = await this.rounds(gameIds);

    const allRoundIdsForPlayer = await Promise.all(playerIds.map(playerId => {
      return this.getOrderedRoundIdsByPlayerId(gameIds, playerId).then(roundIds => {
        return { playerId, roundIds };
      });
    }));

    const eventTypeIds = eventTypes
      .filter(({ trigger }) => [EventTypeTrigger.VERLOREN, EventTypeTrigger.SCHOCK_AUS, EventTypeTrigger.SCHOCK_AUS_STRAFE, EventTypeTrigger.LUSTWURF, EventTypeTrigger.ZWEI_ZWEI_EINS].includes(trigger))
      .map(({ id }) => id);

    const roundIdsByPlayerAndEventType = await Promise.all(
      playerIds.map(playerId => {
        return eventTypeIds.map(eventTypeId => {
          return this.getRoundIdsByPlayerAndEventType(gameIds, eventTypeId, playerId, mode)
            .then(roundIds => ({ playerId, eventTypeId, roundIds }))
        });
      }).flat()
    );

    const streaks = roundIdsByPlayerAndEventType.map(({ playerId, eventTypeId, roundIds }) => {
      const allRoundIds = allRoundIdsForPlayer.find(i => i.playerId === playerId).roundIds;
      const streak = calculateMaxStreak(allRoundIds, roundIds);
      const lastAttendedRoundId = allRoundIds[allRoundIds.length - 1];
      const lastRoundIdOfStreak = streak[streak.length - 1];
      return {
        name: this.findPropertyById(players, playerId, 'name'),
        eventTypeId,
        streak: streak.length,
        isCurrent: lastAttendedRoundId === lastRoundIdOfStreak,
        lastRoundIdOfStreak,
        datetime: this.findPropertyById(rounds, lastRoundIdOfStreak, 'datetime'),
      };
    });

    const groupedByEventTypeId = groupBy(streaks, 'eventTypeId');
    return Object.entries(groupedByEventTypeId).map(([eventTypeId, streaks]) => ({
      eventTypeId,
      description: this.findPropertyById(eventTypes, eventTypeId, 'description'),
      mode,
      streaks: orderBy(streaks, ['streak', 'datetime'], ['desc', 'desc'])
    }));
  }

  async penaltyStreak({ fromDate, toDate, onlyActivePlayers }, mode: 'NO_PENALTY' | 'AT_LEAST_ONE_PENALTY'): Promise<{ name: string; streak: number; isCurrent: boolean; lastRoundIdOfStreak: string; datetime: string; }[]> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);
    const rounds = await this.rounds(gameIds);

    const allRoundIdsForPlayer = await Promise.all(playerIds.map(playerId => {
      return this.getOrderedRoundIdsByPlayerId(gameIds, playerId).then(roundIds => {
        return { playerId, roundIds };
      });
    }));

    const roundIdsByPlayer = await Promise.all(playerIds.map(playerId => {
      return this.getRoundIdsByPlayerAndAnyPenalty(gameIds, playerId, mode).then(roundIds => {
        return { playerId, roundIds };
      })
    }));

    const streaks = roundIdsByPlayer.map(({ playerId, roundIds }) => {
      const allRoundIds = allRoundIdsForPlayer.find(i => i.playerId === playerId).roundIds;
      const streak = calculateMaxStreak(allRoundIds, roundIds);
      const lastAttendedRoundId = allRoundIds[allRoundIds.length - 1];
      const lastRoundIdOfStreak = streak[streak.length - 1];
      return {
        name: this.findPropertyById(players, playerId, 'name'),
        streak: streak.length,
        isCurrent: lastAttendedRoundId === lastRoundIdOfStreak,
        lastRoundIdOfStreak,
        datetime: this.findPropertyById(rounds, lastRoundIdOfStreak, 'datetime'),
      };
    });

    return orderBy(streaks, ['streak', 'datetime'], ['desc', 'desc']);
  }

  async attendanceStreak({ fromDate, toDate, onlyActivePlayers }): Promise<unknown> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);
    const rounds = await this.rounds(gameIds);
    const allRoundIds = await this.roundIds(gameIds);

    const allRoundIdsForPlayer = await Promise.all(playerIds.map(playerId => {
      return this.getOrderedRoundIdsByPlayerId(gameIds, playerId).then(roundIds => {
        return { playerId, roundIds };
      });
    }));

    const streaks = allRoundIdsForPlayer.map(({ playerId, roundIds }) => {
      const streak = calculateMaxStreak(allRoundIds, roundIds);
      const lastAttendedRoundId = roundIds[roundIds.length - 1];
      const lastRoundIdOfStreak = streak[streak.length - 1];
      return {
        name: this.findPropertyById(players, playerId, 'name'),
        streak: streak.length,
        isCurrent: lastAttendedRoundId === lastRoundIdOfStreak,
        lastRoundIdOfStreak,
        datetime: this.findPropertyById(rounds, lastRoundIdOfStreak, 'datetime'),
      };
    });

    return orderBy(streaks, ['streak', 'datetime'], ['desc', 'desc']);
  }

  private findPropertyById(list: { id: string }[], id: string, property: string): string {
    return list.find(item => item.id === id)?.[property];
  }
}
