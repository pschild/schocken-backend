import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { maxBy, sumBy } from 'lodash';
import { DataSource } from 'typeorm';
import { MemoizeWithCacheManager } from '../../decorator/cached.decorator';
import { EventTypeContext } from '../../event-type/enum/event-type-context.enum';
import { PenaltyDto } from '../../penalty/dto/penalty.dto';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { addPenalties, penaltySumByUnit } from '../../penalty/penalty.utils';
import { AttendanceStatisticsService } from '../attendance/attendance-statistics.service';
import {
  CountDto,
  MostExpensiveGameDto,
  MostExpensiveRoundAveragePerGameDto,
  MostExpensiveRoundDto,
  PenaltyByPlayerTableDto
} from '../dto';
import { GameStatisticsService } from '../game/game-statistics.service';
import { PlayerStatisticsService } from '../player/player-statistics.service';
import { RoundStatisticsService } from '../round/round-statistics.service';
import { addRanking, findPropertyById } from '../statistics.utils';

@Injectable()
export class PenaltyStatisticsService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    private playerStatisticsService: PlayerStatisticsService,
    private attendanceStatisticsService: AttendanceStatisticsService,
    private gameStatisticsService: GameStatisticsService,
    private roundStatisticsService: RoundStatisticsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
  }

  @MemoizeWithCacheManager()
  async euroPenaltiesByPlayer(gameIds: string[], playerIds: string[]): Promise<{ playerId: string; context: EventTypeContext; penalty: string; }[]> {
    const roundIds = await this.roundStatisticsService.roundIds(gameIds);
    if (gameIds.length === 0) {
      return Promise.resolve([]);
    }

    let gamesAndRoundsCondition = `"gameId" IN (${gameIds.map(id => `'${id}'`).join(',')})`;
    if (roundIds.length > 0) {
      gamesAndRoundsCondition = `"roundId" IN (${roundIds.map(id => `'${id}'`).join(',')}) OR ${gamesAndRoundsCondition}`
    }

    return this.dataSource.query(`
        SELECT "playerId", context, SUM("multiplicatorValue" * "penaltyValue") AS penalty
        FROM event
        WHERE "penaltyUnit" = 'EURO'
        AND (${gamesAndRoundsCondition})
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        GROUP BY "playerId", context
    `);
  }

  @MemoizeWithCacheManager()
  async penaltySum(gameIds: string[], onlyActivePlayers: boolean): Promise<PenaltyDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);

    return (await this.gameStatisticsService.gamesWithPenalties(gameIds, playerIds))
      .map(({ combinedPenalties }) => combinedPenalties)
      .reduce((prev, curr) => addPenalties(prev, curr), []);
  }

  async mostExpensiveGame(gameIds: string[], onlyActivePlayers: boolean): Promise<MostExpensiveGameDto> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);

    // oldest (first) record wins!
    return maxBy(
      (await this.gameStatisticsService.gamesWithPenalties(gameIds, playerIds)).map(result => ({ id: result.id, datetime: result.datetime, roundAverage: result.roundAverage, sum: penaltySumByUnit(result.combinedPenalties, PenaltyUnit.EURO) })),
      item => item.sum
    );
  }

  async mostExpensiveRound(gameIds: string[], onlyActivePlayers: boolean): Promise<MostExpensiveRoundDto> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const rounds = await this.roundStatisticsService.rounds(gameIds);

    // oldest (first) record wins!
    const maxValue = maxBy(await this.roundStatisticsService.roundsWithPenalties(gameIds, playerIds), item => item.sum);
    return maxValue ? {
      gameId: findPropertyById(rounds, maxValue.id, 'gameId'),
      roundId: maxValue.id,
      datetime: maxValue.datetime,
      sum: maxValue.sum,
    } : null;
  }

  async mostExpensiveRoundAveragePerGame(gameIds: string[], onlyActivePlayers: boolean): Promise<MostExpensiveRoundAveragePerGameDto> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);

    // oldest (first) record wins!
    return maxBy(
      (await this.gameStatisticsService.gamesWithPenalties(gameIds, playerIds)).map(result => ({ id: result.id, datetime: result.datetime, roundAverage: result.roundAverage })),
      item => item.roundAverage
    );
  }

  async euroPerGame(gameIds: string[], onlyActivePlayers: boolean): Promise<CountDto> {
    const penalties = await this.penaltySum(gameIds, onlyActivePlayers);
    return { count: (penaltySumByUnit(penalties, PenaltyUnit.EURO) / gameIds.length) || undefined };
  }

  async euroPerRound(gameIds: string[], onlyActivePlayers: boolean): Promise<CountDto> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const roundIds = await this.roundStatisticsService.roundIds(gameIds);

    const roundPenalties = await this.roundStatisticsService.roundsWithPenalties(gameIds, playerIds);
    const sum = sumBy(roundPenalties, item => item.sum);
    return { count: (sum / roundIds.length) || undefined };
  }

  async penaltyByPlayerTable(gameIds: string[], onlyActivePlayers: boolean): Promise<PenaltyByPlayerTableDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);

    const attendancesByPlayerId = await this.attendanceStatisticsService.attendancesByPlayerId(gameIds, playerIds);

    const allPenalties = await this.penaltySum(gameIds, onlyActivePlayers);
    const penaltySumEuro = penaltySumByUnit(allPenalties, PenaltyUnit.EURO);

    const playerPenalties = await this.euroPenaltiesByPlayer(gameIds, playerIds);
    return addRanking(
      playerIds.map(playerId => {
        const gameEventEuroSum = +playerPenalties.find(p => p.playerId === playerId && p.context === EventTypeContext.GAME)?.penalty || 0;
        const roundEventEuroSum = +playerPenalties.find(p => p.playerId === playerId && p.context === EventTypeContext.ROUND)?.penalty || 0;
        const euroSum = gameEventEuroSum + roundEventEuroSum;
        const roundCountByPlayer = attendancesByPlayerId.find(i => i.playerId === playerId)?.count;
        return {
          playerId,
          name: findPropertyById(players, playerId, 'name'),
          gameEventEuroSum,
          roundEventEuroSum,
          euroSum,
          quote: euroSum / penaltySumEuro,
          euroPerRound: roundCountByPlayer ? roundEventEuroSum / roundCountByPlayer : 0,
        };
      }),
      ['euroSum', 'euroPerRound'],
      ['desc', 'desc']
    );
  }

}
