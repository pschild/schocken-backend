import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { PenaltyDto } from 'src/penalty/dto/penalty.dto';
import { Between, DataSource, In, Repository } from 'typeorm';
import { MemoizeWithCacheManager } from '../../decorator/cached.decorator';
import { EventPenaltyDto } from '../../event/dto/event-penalty.dto';
import { Event } from '../../model/event.entity';
import { Game } from '../../model/game.entity';
import { Round } from '../../model/round.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { addPenalties, penaltySumByUnit, summarizePenalties } from '../../penalty/penalty.utils';
import { CountDto } from '../dto';

@Injectable()
export class GameStatisticsService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
  }

  @MemoizeWithCacheManager()
  async gameIds(fromDate: Date, toDate: Date): Promise<string[]> {
    const result = await this.gameRepo.find({ select: ['id'], where: { datetime: Between(fromDate, toDate), excludeFromStatistics: false }, order: { datetime: 'ASC' } });
    return result.map(({ id }) => id);
  }

  @MemoizeWithCacheManager()
  async previousGameIdsOfYear(gameId: string): Promise<string[]> {
    const result = await this.dataSource.query(`
        SELECT id
        FROM game
        WHERE EXTRACT(YEAR FROM datetime) = (SELECT EXTRACT(YEAR FROM datetime) FROM game WHERE id = '${gameId}')
        AND datetime <= (SELECT datetime FROM game WHERE id = '${gameId}')
    `);
    return result.map(({ id }) => id);
  }

  @MemoizeWithCacheManager()
  async games(gameIds: string[] = []): Promise<{ id: string; datetime: Date; }[]> {
    return this.gameRepo.find({
      select: ['id', 'datetime'],
      ...(gameIds.length > 0 ? { where: {id: In(gameIds)} } : {}),
      order: { datetime: 'ASC' }
    });
  }

  @MemoizeWithCacheManager()
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

  @MemoizeWithCacheManager()
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

  @MemoizeWithCacheManager()
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

  async countGames(gameIds: string[]): Promise<CountDto> {
    return { count: gameIds.length };
  }

}
