import { Injectable } from '@nestjs/common';
import { intersection } from 'lodash';
import { DataSource } from 'typeorm';
import { Cached } from '../../decorator/cached.decorator';
import { QuoteByNameDto } from '../dto';
import { GameStatisticsService } from '../game/game-statistics.service';
import { PlayerStatisticsService } from '../player/player-statistics.service';
import { RoundStatisticsService } from '../round/round-statistics.service';
import { addRanking, findPropertyById } from '../statistics.utils';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class AttendanceStatisticsService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    private playerStatisticsService: PlayerStatisticsService,
    private gameStatisticsService: GameStatisticsService,
    private roundStatisticsService: RoundStatisticsService,
  ) {
  }

  @Cached()
  async finalsByPlayerId(gameIds: string[], playerIds: string[]): Promise<{ count: number; playerId: string; }[]> {
    const roundIds = await this.roundStatisticsService.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }

    const result = await this.dataSource.query(`
        SELECT count(*), "playerId"
        FROM finals
        WHERE "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        GROUP BY "playerId"
    `);

    return result.map(({ playerId, count }) => ({ playerId, count: +count }));
  }

  @Cached()
  async attendancesByPlayerId(gameIds: string[], playerIds: string[]): Promise<{ count: number; playerId: string; }[]> {
    const roundIds = await this.roundStatisticsService.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }

    const result = await this.dataSource.query(`
        SELECT count(*), "playerId"
        FROM attendances
        WHERE "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        GROUP BY "playerId"
    `);

    return result.map(({ playerId, count }) => ({ playerId, count: +count }));
  }

  async attendancesTable(gameIds: string[], onlyActivePlayers: boolean): Promise<QuoteByNameDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);

    const roundCount = await this.roundStatisticsService.countRounds(gameIds);
    const attendances = await this.attendancesByPlayerId(gameIds, playerIds);
    return addRanking(
      attendances.map(playerInfo => ({
        playerId: playerInfo.playerId,
        name: findPropertyById(players, playerInfo.playerId, 'name'),
        count: playerInfo.count,
        quote: playerInfo.count / roundCount.count
      })),
      ['quote'],
      ['desc']
    );
  }

  async finalsTable(gameIds: string[], onlyActivePlayers: boolean): Promise<QuoteByNameDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);
    const gameIdsSinceFirstFinal = await this.gameStatisticsService.getGameIdsSinceFirstFinal();

    // ATTENTION: We need to calculate the attended rounds from the date of the first final!
    const filteredGameIds = intersection(gameIds, gameIdsSinceFirstFinal);
    const attendancesSinceFirstFinal = await this.attendancesByPlayerId(filteredGameIds, playerIds);

    const finals = await this.finalsByPlayerId(gameIds, playerIds);
    return addRanking(
      finals.map(playerInfo => {
        const roundCount = attendancesSinceFirstFinal.find(p => p.playerId === playerInfo.playerId)?.count || 0;
        return {
          playerId: playerInfo.playerId,
          name: findPropertyById(players, playerInfo.playerId, 'name'),
          count: playerInfo.count,
          quote: roundCount ? playerInfo.count / roundCount : 0,
        };
      }),
      ['quote']
    );
  }

}
