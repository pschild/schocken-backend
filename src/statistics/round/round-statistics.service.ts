import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { groupBy, maxBy } from 'lodash';
import { DataSource, In, Repository } from 'typeorm';
import { Cached } from '../../decorator/cached.decorator';
import { EventPenaltyDto } from '../../event/dto/event-penalty.dto';
import { Round } from '../../model/round.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { penaltySumByUnit, summarizePenalties } from '../../penalty/penalty.utils';
import { CountDto, RoundCountByGameIdDto } from '../dto';
import { EventTypesStatisticsService } from '../event-types/event-types-statistics.service';
import { GameStatisticsService } from '../game/game-statistics.service';
import { EventTypeStreakModeEnum } from '../streak/enum/event-type-streak-mode.enum';
import { PenaltyStreakModeEnum } from '../streak/enum/penalty-streak-mode.enum';

@Injectable()
export class RoundStatisticsService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @InjectRepository(Round) private readonly roundRepo: Repository<Round>,
    private gameStatisticsService: GameStatisticsService,
    @Inject(forwardRef(() => EventTypesStatisticsService)) private eventTypesStatisticsService: EventTypesStatisticsService,
  ) {
  }

  @Cached()
  async rounds(gameIds: string[]): Promise<{ id: string; gameId: string; datetime: string; }[]> {
    if (gameIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.dataSource.query(`
        SELECT id, "gameId", datetime
        FROM round
        WHERE "gameId" IN (${gameIds.map(id => `'${id}'`).join(',')})
        ORDER BY datetime
    `);
  }

  @Cached()
  async roundIds(gameIds: string[]): Promise<string[]> {
    return (await this.rounds(gameIds)).map(({ id }) => id);
  }

  @Cached()
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

  @Cached()
  async gameIdByRoundId(gameIds: string[], roundId: string): Promise<string | null> {
    const roundIdsByGameId = await this.roundIdsByGameId(gameIds);
    roundIdsByGameId.forEach(item => {
      if (item.roundIds.includes(roundId)) {
        return item.gameId;
      }
    });
    return null;
  }

  @Cached()
  async roundIdsByEventTypeId(gameIds: string[], eventTypeId: string): Promise<{ gameId: string; roundIds: string[] }[]> {
    const roundIds = await this.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }
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

  @Cached()
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

  @Cached()
  async getRoundIdsByPlayerAndEventType(gameIds: string[], eventTypeId: string, playerId: string, mode: EventTypeStreakModeEnum): Promise<string[]> {
    const roundIds = await this.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }

    const result = await this.dataSource.query(`
        SELECT "roundId"
        FROM attendances
        LEFT JOIN round ON attendances."roundId" = round.id
        WHERE "playerId" = '${playerId}'
        AND "roundId" ${mode === EventTypeStreakModeEnum.WITH_EVENT ? '' : 'NOT'} IN (
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

  @Cached()
  async getRoundIdsByPlayerAndAnyPenalty(gameIds: string[], playerId: string, mode: PenaltyStreakModeEnum): Promise<string[]> {
    const roundIds = await this.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }
    const eventTypeIdsWithPenalty = await this.eventTypesStatisticsService.getRoundEventTypeIdsWithPenalty();

    const result = await this.dataSource.query(`
        SELECT "roundId"
        FROM attendances
        LEFT JOIN round ON attendances."roundId" = round.id
        WHERE "playerId" = '${playerId}'
        AND "roundId" ${mode === PenaltyStreakModeEnum.AT_LEAST_ONE_PENALTY ? '' : 'NOT'} IN (
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

  @Cached()
  async roundsWithPenalties(gameIds: string[], playerIds: string[]): Promise<{ id: string; datetime: Date; sum: number }[]> {
    const games = await this.gameStatisticsService.gamesWithRoundsAndEvents(gameIds, playerIds);
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

  async countRounds(gameIds: string[]): Promise<CountDto> {
    const roundIds = await this.roundIds(gameIds);
    return { count: roundIds.length };
  }

  async averageRoundsPerGame(gameIds: string[]): Promise<CountDto> {
    const roundsIds = await this.roundIds(gameIds);

    return { count: (roundsIds.length / gameIds.length) || undefined };
  }

  async maxRoundsPerGame(gameIds: string[]): Promise<RoundCountByGameIdDto> {
    if (gameIds.length === 0) {
      return Promise.resolve(null);
    }
    const gameWithMaxRounds = maxBy(
      (await this.gameStatisticsService.gamesWithRoundsAndEvents(gameIds)),
      game => game.rounds.length
    );
    return {
      id: gameWithMaxRounds.id,
      roundCount: gameWithMaxRounds.rounds.length,
      datetime: gameWithMaxRounds.datetime,
    };
  }

}
