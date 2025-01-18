import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, Not, Repository } from 'typeorm';
import { memoizeAsync } from 'utils-decorators';
import { EventPenaltyDto } from '../event/dto/event-penalty.dto';
import { PlaceType } from '../game/enum/place-type.enum';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PenaltyDto } from '../penalty/dto/penalty.dto';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { addPenalties, penaltySumByUnit, summarizePenalties } from '../penalty/penalty.utils';

const CACHE_TTL = 1000 * 60 * 60;

@Injectable(/*{ scope: Scope.REQUEST }*/)
export class StatisticsService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @InjectRepository(Round) private readonly roundRepo: Repository<Round>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
  ) {
    // dataSource.queryResultCache.clear();
  }

  // level 0
  @memoizeAsync(CACHE_TTL)
  async gameIds(fromDate: Date, toDate: Date): Promise<string[]> {
    const games = await this.gameRepo.find({ select: ['id'], where: { datetime: Between(fromDate, toDate), excludeFromStatistics: false }, order: { datetime: 'ASC' } });
    return games.map(({ id }) => id);
  }

  @memoizeAsync(CACHE_TTL)
  async players(onlyActive: boolean): Promise<{ id: string; name: string; }[]> {
    return this.playerRepo.find({ select: ['id', 'name'], where: { ...(onlyActive ? { active: true } : {}), }, withDeleted: !onlyActive });
  }

  @memoizeAsync(CACHE_TTL)
  async playerIds(onlyActive: boolean): Promise<string[]> {
    return (await this.players(onlyActive)).map(({ id }) => id);
  }

  // level 0
  @memoizeAsync(CACHE_TTL)
  async roundIds(gameIds: string[]): Promise<string[]> {
    const rounds = await this.roundRepo.find({ select: ['id'], where: { game: { id: In(gameIds) } }, order: { datetime: 'ASC' } });
    return rounds.map(({ id }) => id);
  }

  // level 0
  @memoizeAsync(CACHE_TTL)
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
  @memoizeAsync(CACHE_TTL)
  async attendancesByPlayerId(gameIds: string[], playerIds: string[]): Promise<{ count: string; playerId: string; }[]> {
    const roundIds = await this.roundIds(gameIds);
    return this.dataSource.manager.query(`
        SELECT count(*), "playerId"
        FROM hoptimisten.attendances
        WHERE "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        GROUP BY "playerId"
    `);
  }

  // // level 0
  // @memoizeAsync(CACHE_TTL)
  // async events(gameIds: string[]): Promise<Event[]> {
  //   const roundIds = await this.roundIds(gameIds);
  //   return this.eventRepo.find({
  //     select: {
  //       id: true,
  //       datetime: true,
  //       multiplicatorValue: true,
  //       penaltyValue: true,
  //       penaltyUnit: true,
  //       context: true,
  //       gameId: true,
  //       roundId: true,
  //     },
  //     where: [
  //       { game: { id: In(gameIds) } },
  //       { round: { id: In(roundIds) } }
  //     ],
  //     order: { datetime: 'ASC' },
  //   });
  // }

  // level 1
  @memoizeAsync(CACHE_TTL)
  async gamesWithPenalties(gameIds: string[], playerIds: string[]): Promise<{ id: string; datetime: Date; penalties: PenaltyDto[]; roundAverage: number; }[]> {
    const games = await this.gamesWithRoundsAndEvents(gameIds, playerIds);
    return games
      .map(game => {
        const penalties = summarizePenalties([
          ...EventPenaltyDto.fromEntities(game.events),
          ...EventPenaltyDto.fromEntities(game.rounds.map(round => round.events).flat()),
        ]);
        return {
          id: game.id,
          datetime: game.datetime,
          penalties,
          roundAverage: penaltySumByUnit(penalties, PenaltyUnit.EURO) / game.rounds.length
        };
      });
  }

  // level 1
  @memoizeAsync(CACHE_TTL)
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
  @memoizeAsync(CACHE_TTL)
  async penaltySum({ fromDate, toDate, onlyActivePlayers }): Promise<PenaltyDto[]> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);

    return (await this.gamesWithPenalties(gameIds, playerIds))
      .map(({ penalties }) => penalties)
      .reduce((prev, curr) => {
        return addPenalties(prev, curr);
      });
  }

  // level 1
  async countRounds({ fromDate, toDate }): Promise<number> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const roundIds = await this.roundIds(gameIds);

    return roundIds.length;
  }

  // level -1
  async attendancesTable({ fromDate, toDate, onlyActivePlayers }): Promise<unknown> {
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

  private findPropertyById(list: { id: string }[], id: string, property: string): unknown {
    return list.find(item => item.id === id)?.[property];
  }

  // level -1
  async averageRoundsPerGame({ fromDate, toDate }): Promise<number> {
    const gameIds = await this.gameIds(fromDate, toDate);

    const roundsIds = await this.roundIds(gameIds);
    return roundsIds.length / gameIds.length;
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
    return penaltySumByUnit(penalties, PenaltyUnit.EURO) / gameIds.length;
  }

  // level -1
  async euroPerRound({ fromDate, toDate, onlyActivePlayers }): Promise<number> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);
    const roundIds = await this.roundIds(gameIds);

    const roundPenalties = await this.roundsWithPenalties(gameIds, playerIds);
    const sum = roundPenalties.reduce((prev, curr) => prev + curr.sum, 0);
    return sum / roundIds.length;
  }

  // level -1
  async mostExpensiveGame({ fromDate, toDate, onlyActivePlayers }): Promise<{ id: string; sum: number; }> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);

    return (await this.gamesWithPenalties(gameIds, playerIds))
      .map(result => ({ id: result.id, datetime: result.datetime, sum: result.penalties.find(p => p.unit === PenaltyUnit.EURO)?.sum }))
      .reduce((prev, curr) => {
        return curr.sum >= prev.sum ? curr : prev
      });
  }

  // level -1
  async mostExpensiveRoundAveragePerGame({ fromDate, toDate, onlyActivePlayers }): Promise<{ id: string; roundAverage: number; }> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);

    return (await this.gamesWithPenalties(gameIds, playerIds))
      .map(result => ({ id: result.id, datetime: result.datetime, roundAverage: result.roundAverage }))
      .reduce((prev, curr) => {
        return curr.roundAverage >= prev.roundAverage ? curr : prev
      });
  }

  // level -1
  async mostExpensiveRound({ fromDate, toDate, onlyActivePlayers }): Promise<{ id: string; sum: number; }> {
    const gameIds = await this.gameIds(fromDate, toDate);
    const playerIds = await this.playerIds(onlyActivePlayers);

    return (await this.roundsWithPenalties(gameIds, playerIds))
      .reduce((prev, curr) => {
        return curr.sum >= prev.sum ? curr : prev
      });
  }
}
