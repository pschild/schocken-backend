import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { groupBy, intersection, maxBy, orderBy, sumBy } from 'lodash';
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

const CACHE_TTL = 5000/* * 60 * 60*/;

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
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventType) private readonly eventTypeRepo: Repository<EventType>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
  ) {
  }

  // level 0
  @Cached(CACHE_TTL)
  async gameIds(fromDate: Date, toDate: Date): Promise<string[]> {
    const result = await this.gameRepo.find({ select: ['id'], where: { datetime: Between(fromDate, toDate), excludeFromStatistics: false }, order: { datetime: 'ASC' } });
    return result.map(({ id }) => id);
  }

  // level 0
  @Cached(CACHE_TTL)
  async games(gameIds: string[]): Promise<{ id: string; datetime: Date; }[]> {
    return this.gameRepo.find({ select: ['id', 'datetime'], where: { id: In(gameIds) }, order: { datetime: 'ASC' } });
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
  async roundIdsByGameId(gameIds: string[]): Promise<{ gameId: string; roundIds: string[] }[]> {
    const result = await this.roundRepo.find({
      select: { id: true, game: { id: true } },
      where: { game: { id: In(gameIds) } },
      order: { datetime: 'ASC' },
      relations: ['game']
    });
    const groupedByGameId = groupBy(result, e => e.game.id);
    return Object.entries(groupedByGameId).map(([gameId, rounds]) => ({
      gameId,
      roundIds: rounds.map(r => r.id)
    }));
  }

  // level 0
  @Cached(CACHE_TTL)
  async roundIdsByEventTypeId(gameIds: string[], eventTypeId: string): Promise<{ gameId: string; roundIds: string[] }[]> {
    const roundIds = await this.roundIds(gameIds);
    const result = await this.dataSource.query(`
        SELECT DISTINCT "roundId", round."gameId", round.datetime
        FROM event
        LEFT JOIN round ON event."roundId" = round.id
        WHERE "eventTypeId" = '${eventTypeId}'
        AND "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
        ORDER BY round.datetime
    `);
    const groupedByGameId = groupBy(result, 'gameId');
    return Object.entries(groupedByGameId).map(([gameId, gameIdAndRoundIdItems]) => ({
      gameId,
      roundIds: gameIdAndRoundIdItems.map(r => r.roundId)
    }));
  }

  // level 0
  @Cached(CACHE_TTL)
  async eventTypeCountsByPlayerId(gameIds: string[], playerIds: string[], eventTypeIds?: string[]): Promise<{ playerId: string; count: number }[]> {
    const roundIds = await this.roundIds(gameIds);
    const result = await this.dataSource.query(`
        SELECT "playerId", "eventTypeId", count(*)
        FROM event
        WHERE (
          "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
          OR "gameId" IN (${gameIds.map(id => `'${id}'`).join(',')})
        )
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        ${eventTypeIds ? `AND "eventTypeId" IN (${eventTypeIds.map(id => `'${id}'`).join(',')}) ` : ''}
        GROUP BY "playerId", "eventTypeId"
    `);
    return result.map(({ playerId, eventTypeId, count }) => ({ playerId, eventTypeId, count: +count }));
  }

  // level 0
  @Cached(CACHE_TTL)
  async gamesWithRoundsAndEvents(gameIds: string[], playerIds?: string[]): Promise<{ id: string; datetime: Date; rounds: Round[]; events: Event[] }[]> {
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
    if (!!playerIds && playerIds.length > 0) {
      return result.map(game => ({
        ...game,
        events: game.events.filter(e => playerIds.includes(e.player.id)),
        rounds: game.rounds.map(round => ({
          ...round,
          events: round.events.filter(e => playerIds.includes(e.player.id))
        }))
      }));
    }
    return result;
  }

  // level 0
  @Cached(CACHE_TTL)
  async euroPenaltiesByPlayer(gameIds: string[], playerIds: string[]): Promise<{ playerId: string; context: EventTypeContext; penalty: string; }[]> {
    const roundIds = await this.roundIds(gameIds);

    return this.dataSource.query(`
        SELECT "playerId", context, SUM("multiplicatorValue" * "penaltyValue") AS penalty
        FROM event
        WHERE "penaltyUnit" = 'EURO'
        AND (
          "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
          OR "gameId" IN (${gameIds.map(id => `'${id}'`).join(',')})
        )
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        GROUP BY "playerId", context
    `);
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
  async getGameIdsSinceFirstFinal(): Promise<string[]> {
    const result = await this.dataSource.query(`
        SELECT id, datetime
        FROM game
        WHERE datetime >= (
            SELECT game.datetime
            FROM game
            LEFT JOIN round ON game.id = round."gameId"
            LEFT JOIN finals ON round.id = finals."roundId"
            WHERE finals."roundId" IS NOT NULL
            ORDER BY game.datetime
            LIMIT 1
        )
    `);
    return result.map(({ id }) => id);
  }

  // level 0
  @Cached(CACHE_TTL)
  async finalsByPlayerId(gameIds: string[], playerIds: string[]): Promise<{ count: string; playerId: string; }[]> {
    const roundIds = await this.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.dataSource.query(`
        SELECT count(*), "playerId"
        FROM finals
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

  // level 0
  @Cached(CACHE_TTL)
  async schockAusEffectivity(gameIds: string[], playerIds: string[]): Promise<{ roundId: string; playerId: string; sasCount: number }[]> {
    const roundIds = await this.roundIds(gameIds);
    const eventTypes = await this.eventTypes();
    const schockAusId = eventTypes.find(t => t.trigger === EventTypeTrigger.SCHOCK_AUS).id;
    const schockAusStrafeId = eventTypes.find(t => t.trigger === EventTypeTrigger.SCHOCK_AUS_STRAFE).id;

    const result = await this.dataSource.query(`
        SELECT "roundId", "playerId", (
            SELECT COUNT(*)
            FROM event e
            WHERE e."roundId" = event."roundId"
            AND e."eventTypeId" = '${schockAusStrafeId}'
            AND "playerId" IN(${playerIds.map(id => `'${id}'`).join(',')})
        ) AS "sasCount"
        FROM event
        WHERE "roundId" IN (
          SELECT "roundId"
          FROM event
          WHERE "eventTypeId" = '${schockAusId}'
          AND "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
          GROUP BY "roundId"
          HAVING COUNT(*) = 1
        )
        AND "eventTypeId" = '${schockAusId}'
        AND "playerId" IN(${playerIds.map(id => `'${id}'`).join(',')})
    `);

    return result.map(({ roundId, playerId, sasCount }) => ({ roundId, playerId, sasCount: +sasCount }));
  }

  // level 0
  @Cached(CACHE_TTL)
  async getDataForPointsCalculation(gameIds: string[]): Promise<{
    gameId: string;
    roundId: string;
    roundHasFinal: boolean;
    roundHasSchockAus: boolean;
    playerId: string;
    isFinalist: boolean;
    lustwurfCount: number;
    zweiZweiEinsCount: number;
    schockAusCount: number;
    hasVerloren: boolean;
  }[]> {
    const eventTypes = await this.eventTypes();
    const schockAusId = eventTypes.find(t => t.trigger === EventTypeTrigger.SCHOCK_AUS).id;
    const zweiZweiEinsId = eventTypes.find(t => t.trigger === EventTypeTrigger.ZWEI_ZWEI_EINS).id;
    const lustwurfId = eventTypes.find(t => t.trigger === EventTypeTrigger.LUSTWURF).id;
    const verlorenId = eventTypes.find(t => t.trigger === EventTypeTrigger.VERLOREN).id;

    const result = await this.dataSource.query(`
        select
            game.id as "gameId",
            round.id as "roundId",
            exists(
                select 1
                from finals
                where "roundId" = round.id
            ) as "roundHasFinal",
            exists(
                select 1
                from event
                where "roundId" = att."roundId"
                and "eventTypeId" = '${schockAusId}'
            ) as "roundHasSchockAus",
            att."playerId",
            exists(
                select 1
                from finals
                where "roundId" = round.id
                  and "playerId" = att."playerId"
            ) as "isFinalist",
            (
                select count(*)
                from event
                where "playerId" = att."playerId"
                  and "roundId" = att."roundId"
                  and "eventTypeId" = '${lustwurfId}'
            ) as "lustwurfCount",
            (
                select count(*)
                from event
                where "playerId" = att."playerId"
                  and "roundId" = att."roundId"
                  and "eventTypeId" = '${zweiZweiEinsId}'
            ) as "zweiZweiEinsCount",
            (
                select count(*)
                from event
                where "playerId" = att."playerId"
                  and "roundId" = att."roundId"
                  and "eventTypeId" = '${schockAusId}'
            ) as "schockAusCount",
            exists(
                select 1
                from event
                where "playerId" = att."playerId"
                  and "roundId" = att."roundId"
                  and "eventTypeId" = '${verlorenId}'
            ) as "hasVerloren"
        from game
        left join round on game.id = round."gameId"
        left join attendances att on round.id = att."roundId"
        where game.id IN (${gameIds.map(id => `'${id}'`).join(',')})
        order by round.datetime
    `);

    return result.map(row => ({
      ...row,
      zweiZweiEinsCount: +row.zweiZweiEinsCount,
      lustwurfCount: +row.lustwurfCount,
      schockAusCount: +row.schockAusCount,
    }));
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
  async penaltySum(gameIds: string[], onlyActivePlayers: boolean): Promise<PenaltyDto[]> {
    const playerIds = await this.playerIds(onlyActivePlayers);

    return (await this.gamesWithPenalties(gameIds, playerIds))
      .map(({ combinedPenalties }) => combinedPenalties)
      .reduce((prev, curr) => addPenalties(prev, curr), []);
  }

  // level 1
  async countRounds(gameIds: string[]): Promise<number> {
    const roundIds = await this.roundIds(gameIds);

    return roundIds.length;
  }

  // level 1
  @Cached(CACHE_TTL)
  async pointsPerGame(gameIds: string[], onlyActivePlayers: boolean): Promise<{ gameId: string; datetime: string; points: { playerId: string; name: string; attended: boolean; gamePoints: number; bonusPoints: number; penaltyPoints: number; gamePointsSum: number; points: number }[] }[]> {
    const pkteInfo = await this.getDataForPointsCalculation(gameIds);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);
    const games = await this.games(gameIds);

    const groupedByGameId = groupBy(pkteInfo, 'gameId');
    return Object.entries(groupedByGameId).map(([gameId, itemsByGameId]) => {
      const groupedByPlayerId = groupBy(itemsByGameId, 'playerId');
      const pointsByAttendee = Object.entries(groupedByPlayerId).map(([playerId, itemsByPlayerId]) => {
        const { gamePoints, bonusPoints, penaltyPoints, gamePointsSum } = itemsByPlayerId.map(item => {
          const gamePoints = this.calculateGamePoints(item.roundHasFinal, item.roundHasSchockAus, item.isFinalist, item.hasVerloren, item.schockAusCount > 0);
          const bonusPoints = this.calculateBonusPoints(item.schockAusCount);
          const penaltyPoints = this.calculatePenaltyPoints(item.hasVerloren, item.lustwurfCount, item.zweiZweiEinsCount);
          return {
            gamePoints,
            bonusPoints,
            penaltyPoints,
            gamePointsSum: gamePoints + bonusPoints + penaltyPoints,
          }
        })
          .reduce((prev, curr) => {
            return {
              gamePoints: prev.gamePoints + curr.gamePoints,
              bonusPoints: prev.bonusPoints + curr.bonusPoints,
              penaltyPoints: prev.penaltyPoints + curr.penaltyPoints,
              gamePointsSum: prev.gamePointsSum + curr.gamePointsSum,
            }
          });

        return {
          playerId,
          name: this.findPropertyById(players, playerId, 'name'),
          attended: true,
          gamePoints,
          bonusPoints,
          penaltyPoints,
          gamePointsSum,
          points: undefined, // calculated in next step
        };
      });

      const pointsByAttendeeWithPoints = orderBy(pointsByAttendee, ['gamePointsSum', 'gamePoints', 'bonusPoints', 'penaltyPoints'], ['desc', 'desc', 'desc', 'asc'])
        .map((pointInfo, idx) => ({ ...pointInfo, points: this.calculatePoints(idx) }));

      // add players who did not attend, in order to always show all players in table!
      pointsByAttendeeWithPoints.push(
        ...playerIds
          .filter(id => !pointsByAttendee.find(i => i.playerId === id))
          .map(id => ({
            playerId: id,
            name: this.findPropertyById(players, id, 'name'),
            attended: false,
            gamePoints: 0,
            bonusPoints: 0,
            penaltyPoints: 0,
            gamePointsSum: 0,
            points: 0,
          }))
      );

      return {
        gameId,
        datetime: this.findPropertyById(games, gameId, 'datetime'),
        points: orderBy(pointsByAttendeeWithPoints, ['points', 'gamePointsSum', 'gamePoints', 'bonusPoints', 'penaltyPoints', 'name'], ['desc', 'desc', 'desc', 'desc', 'asc', 'asc'])
      };
    });
  }

  private calculatePoints(idx: number): number {
    const POINTS_FOR_RANKS = [7, 5, 4, 3, 2];
    const POINTS_FOR_ATTENDANCE = 1;
    return POINTS_FOR_RANKS[idx] || POINTS_FOR_ATTENDANCE;
  }

  private calculateGamePoints(
    roundHasFinal: boolean,
    roundHasSchockAus: boolean,
    isFinalist: boolean,
    isVerlierer: boolean,
    playerHasSchockAus: boolean
  ): number {
    if (isVerlierer) {
      return 0;
    } else if ((roundHasFinal && isFinalist) || (!roundHasFinal && !playerHasSchockAus)) {
      return 1;
    } else if ((roundHasFinal && !isVerlierer && !isFinalist) || (!roundHasFinal && !isVerlierer && playerHasSchockAus) || (!roundHasFinal && !isVerlierer && !roundHasSchockAus)) {
      return 3;
    } else {
      console.error(`Invalid combination of params: roundHasFinal=${roundHasFinal}, roundHasSchockAus=${roundHasSchockAus}, isFinalist=${isFinalist}, isVerlierer=${isVerlierer}, playerHasSchockAus=${playerHasSchockAus}`);
    }
  }

  private calculateBonusPoints(schockAusCount: number): number {
    const SCHOCK_AUS_FACTOR = 1;
    return schockAusCount * SCHOCK_AUS_FACTOR;
  }

  private calculatePenaltyPoints(
    isVerlierer: boolean,
    lustwurfCount: number,
    zweiZweiEinsCount: number
  ): number {
    const VERLOREN_FACTOR = 1;
    const ZWEI_ZWEI_EINS_FACTOR = 1;
    const LUSTWURF_FACTOR = 3;
    return (isVerlierer ? -1 * VERLOREN_FACTOR : 0) - (zweiZweiEinsCount * ZWEI_ZWEI_EINS_FACTOR) - (lustwurfCount * LUSTWURF_FACTOR);
  }

  // level -1
  async attendancesTable(gameIds: string[], onlyActivePlayers: boolean): Promise<{ name: string; count: number; quote: number }[]> {
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);

    const roundCount = await this.countRounds(gameIds);
    const attendances = await this.attendancesByPlayerId(gameIds, playerIds);
    return attendances.map(playerInfo => ({
      name: this.findPropertyById(players, playerInfo.playerId, 'name'),
      count: +playerInfo.count,
      quote: +playerInfo.count / roundCount
    }));
  }

  // level -1
  async finalsTable(gameIds: string[], onlyActivePlayers: boolean): Promise<{ name: string; count: number; quote: number }[]> {
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);
    const gameIdsSinceFirstFinal = await this.getGameIdsSinceFirstFinal();

    // ATTENTION: We need to calculate the attended rounds from the date of the first final!
    const filteredGameIds = intersection(gameIds, gameIdsSinceFirstFinal);
    const attendancesSinceFirstFinal = await this.attendancesByPlayerId(filteredGameIds, playerIds);

    const finals = await this.finalsByPlayerId(gameIds, playerIds);
    return finals.map(playerInfo => {
      const roundCount = +attendancesSinceFirstFinal.find(p => p.playerId === playerInfo.playerId)?.count || 0;
      return {
        name: this.findPropertyById(players, playerInfo.playerId, 'name'),
        count: +playerInfo.count,
        quote: roundCount ? +playerInfo.count / roundCount : 0,
      };
    });
  }

  // level -1
  async hostsTable(gameIds: string[], onlyActivePlayers: boolean): Promise<{ count: string; hostedById: string | null; placeType: PlaceType; }[]> {
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
  async averageRoundsPerGame(gameIds: string[]): Promise<number> {
    const roundsIds = await this.roundIds(gameIds);

    return (roundsIds.length / gameIds.length) || undefined;
  }

  // level -1
  async maxRoundsPerGame(gameIds: string[]): Promise<{ id: string; roundCount: number; datetime: Date; }> {
    const gameWithMaxRounds = maxBy(
      (await this.gamesWithRoundsAndEvents(gameIds)),
      game => game.rounds.length
    );
    return {
      id: gameWithMaxRounds.id,
      roundCount: gameWithMaxRounds.rounds.length,
      datetime: gameWithMaxRounds.datetime,
    };
  }

  // level -1
  async countGames(gameIds: string[]): Promise<number> {
    return gameIds.length;
  }

  // level -1
  async euroPerGame(gameIds: string[], onlyActivePlayers: boolean): Promise<number> {
    const penalties = await this.penaltySum(gameIds, onlyActivePlayers);
    return (penaltySumByUnit(penalties, PenaltyUnit.EURO) / gameIds.length) || undefined;
  }

  // level -1
  async euroPerRound(gameIds: string[], onlyActivePlayers: boolean): Promise<number> {
    const playerIds = await this.playerIds(onlyActivePlayers);
    const roundIds = await this.roundIds(gameIds);

    const roundPenalties = await this.roundsWithPenalties(gameIds, playerIds);
    const sum = sumBy(roundPenalties, item => item.sum);
    return (sum / roundIds.length) || undefined;
  }

  // level -1
  async mostExpensiveGame(gameIds: string[], onlyActivePlayers: boolean): Promise<{ id: string; sum: number; }> {
    const playerIds = await this.playerIds(onlyActivePlayers);

    // oldest (first) record wins!
    return maxBy(
      (await this.gamesWithPenalties(gameIds, playerIds)).map(result => ({ id: result.id, datetime: result.datetime, roundAverage: result.roundAverage, sum: penaltySumByUnit(result.combinedPenalties, PenaltyUnit.EURO) })),
      item => item.sum
    );
  }

  // level -1
  async mostExpensiveRoundAveragePerGame(gameIds: string[], onlyActivePlayers: boolean): Promise<{ id: string; roundAverage: number; }> {
    const playerIds = await this.playerIds(onlyActivePlayers);

    // oldest (first) record wins!
    return maxBy(
      (await this.gamesWithPenalties(gameIds, playerIds)).map(result => ({ id: result.id, datetime: result.datetime, roundAverage: result.roundAverage })),
      item => item.roundAverage
    );
  }

  // level -1
  async mostExpensiveRound(gameIds: string[], onlyActivePlayers: boolean): Promise<{ id: string; sum: number; }> {
    const playerIds = await this.playerIds(onlyActivePlayers);

    // oldest (first) record wins!
    return maxBy(await this.roundsWithPenalties(gameIds, playerIds), item => item.sum);
  }

  // level -1
  async recordsPerGame(gameIds: string[], onlyActivePlayers: boolean): Promise<{ eventTypeId: string; description: string; records: { count: number; name: string; gameId: string; datetime: string }[] }[]> {
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);
    const eventTypes = await this.eventTypes();
    const games = await this.games(gameIds);

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
  async eventTypeStreaks(gameIds: string[], onlyActivePlayers: boolean, mode: 'WITH_EVENT' | 'WITHOUT_EVENT'): Promise<{ eventTypeId: string; description: string; mode: 'WITH_EVENT' | 'WITHOUT_EVENT'; streaks: { eventTypeId: string; name: string; streak: number; isCurrent: boolean; lastRoundIdOfStreak: string; datetime: string; }[] }[]> {
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

  // level -1
  async penaltyStreak(gameIds: string[], onlyActivePlayers: boolean, mode: 'NO_PENALTY' | 'AT_LEAST_ONE_PENALTY'): Promise<{ name: string; streak: number; isCurrent: boolean; lastRoundIdOfStreak: string; datetime: string; }[]> {
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

  // level -1
  async getSchockAusStreak(gameIds: string[]): Promise<{ gameId: string; datetime: string; streak: number; }> {
    const games = await this.games(gameIds);
    const eventTypes = await this.eventTypes();
    const schockAusEventTypeId = eventTypes.find(t => t.trigger === EventTypeTrigger.SCHOCK_AUS).id;

    const roundIdsByGameId = await this.roundIdsByGameId(gameIds);
    const roundIdsBySchockAus = await this.roundIdsByEventTypeId(gameIds, schockAusEventTypeId);
    const streaks = roundIdsByGameId.map(({ gameId, roundIds }) => {
      const schockAusRoundIds = roundIdsBySchockAus.find(i => i.gameId === gameId).roundIds;
      const streak = calculateMaxStreak(roundIds, schockAusRoundIds);
      return {
        gameId,
        datetime: this.findPropertyById(games, gameId, 'datetime'),
        streak: streak.length
      };
    });
    return maxBy(streaks, 'streak');
  }

  // level -1
  async attendanceStreak(gameIds: string[], onlyActivePlayers: boolean): Promise<{ name: string; streak: number; isCurrent: boolean; lastRoundIdOfStreak: string; datetime: string; }[]> {
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

  // level -1
  async penaltyByPlayerTable(gameIds: string[], onlyActivePlayers: boolean): Promise<{ name: string; gameEventEuroSum: number; roundEventEuroSum: number; euroSum: number; quote: number; euroPerRound: number; }[]> {
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);

    const attendancesByPlayerId = await this.attendancesByPlayerId(gameIds, playerIds);

    const allPenalties = await this.penaltySum(gameIds, onlyActivePlayers);
    const penaltySumEuro = penaltySumByUnit(allPenalties, PenaltyUnit.EURO);

    const playerPenalties = await this.euroPenaltiesByPlayer(gameIds, playerIds);
    return playerIds.map(playerId => {
      const gameEventEuroSum = +playerPenalties.find(p => p.playerId === playerId && p.context === EventTypeContext.GAME)?.penalty || 0;
      const roundEventEuroSum = +playerPenalties.find(p => p.playerId === playerId && p.context === EventTypeContext.ROUND)?.penalty || 0;
      const euroSum = gameEventEuroSum + roundEventEuroSum;
      const roundCountByPlayer = +attendancesByPlayerId.find(i => i.playerId === playerId)?.count;
      return {
        name: this.findPropertyById(players, playerId, 'name'),
        gameEventEuroSum,
        roundEventEuroSum,
        euroSum,
        quote: euroSum / penaltySumEuro,
        euroPerRound: roundCountByPlayer ? euroSum / roundCountByPlayer : 0,
      };
    });
  }

  // level -1
  async eventTypeCountsByPlayer(gameIds: string[], onlyActivePlayers: boolean, eventTypeIds: string[]): Promise<{ name: string; count: number }[]> {
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);

    return (await this.eventTypeCountsByPlayerId(gameIds, playerIds, eventTypeIds)).map(({ playerId, count }) => ({
      name: this.findPropertyById(players, playerId, 'name'),
      count
    }));
  }

  // level -1
  async eventTypeCounts(gameIds: string[], onlyActivePlayers: boolean): Promise<{ description: string; count: number }[]> {
    const playerIds = await this.playerIds(onlyActivePlayers);
    const eventTypes = await this.eventTypes();

    const eventTypeCountsByPlayerId = await this.eventTypeCountsByPlayerId(gameIds, playerIds);
    return Object.entries(groupBy(eventTypeCountsByPlayerId, 'eventTypeId')).map(([eventTypeId, info]) => {
      return {
        description: this.findPropertyById(eventTypes, eventTypeId, 'description'),
        count: sumBy(info, 'count')
      };
    });
  }

  // level -1
  async schockAusEffectivityTable(gameIds: string[], onlyActivePlayers: boolean): Promise<{ name: string; saCount: number; sasCount: number; quote: number; }[]> {
    const playerIds = await this.playerIds(onlyActivePlayers);
    const players = await this.players(onlyActivePlayers);

    const result = await this.schockAusEffectivity(gameIds, playerIds);
    const grouped = groupBy(result, 'playerId');
    return Object.entries(grouped).map(([playerId, info]) => {
      const saCount = info.length;
      const sasCount = sumBy(info, 'sasCount');
      return {
        name: this.findPropertyById(players, playerId, 'name'),
        saCount,
        sasCount,
        quote: sasCount / saCount,
      };
    });
  }

  // level -1
  async accumulatedPoints(gameIds: string[], onlyActivePlayers: boolean): Promise<{ gameId: string; datetime: string; points: { playerId: string; name: string; gamePoints: number; bonusPoints: number; penaltyPoints: number; gamePointsSum: number; points: number; tendency: number; }[] }[]> {
    const pointsPerGame = await this.pointsPerGame(gameIds, onlyActivePlayers);
    const accumulatedPointsPerGame = pointsPerGame.reduce((prev, curr) => {
      const lastGame = prev.length > 0 ? prev[prev.length - 1] : null;
      const accPoints = curr.points.map(({ playerId, name, gamePoints, bonusPoints, penaltyPoints, gamePointsSum, points }) => {
        return {
          playerId,
          name,
          gamePoints: gamePoints + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.gamePoints || 0 : 0),
          bonusPoints: bonusPoints + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.bonusPoints || 0 : 0),
          penaltyPoints: penaltyPoints + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.penaltyPoints || 0 : 0),
          gamePointsSum: gamePointsSum + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.gamePointsSum || 0 : 0),
          points: points + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.points || 0 : 0),
        };
      });
      return [...prev, { ...curr, points: orderBy(accPoints, ['points', 'gamePointsSum', 'gamePoints', 'bonusPoints', 'penaltyPoints'], ['desc', 'desc', 'desc', 'desc', 'asc']) }];
    }, []);

    return accumulatedPointsPerGame.reduce((prev, curr) => {
      const lastGame = prev.length > 0 ? prev[prev.length - 1] : null;
      if (!lastGame) {
        return [...prev, { ...curr, points: curr.points.map(item => ({ ...item, tendency: 0 })) }];
      }
      return [...prev, { ...curr, points: curr.points.map((item, idx) => {
        const prevIdx = lastGame.points.findIndex(i => i.playerId === item.playerId);
        return {...item, tendency: prevIdx - idx };
      }) }];
    }, []);
  }

  private findPropertyById(list: { id: string }[], id: string, property: string): string {
    return list.find(item => item.id === id)?.[property];
  }
}
