import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { groupBy, sumBy } from 'lodash';
import { DataSource, Repository } from 'typeorm';
import { Cached } from '../../decorator/cached.decorator';
import { EventTypeContext } from '../../event-type/enum/event-type-context.enum';
import { EventTypeTrigger } from '../../event-type/enum/event-type-trigger.enum';
import { EventType } from '../../model/event-type.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { AttendanceStatisticsService } from '../attendance/attendance-statistics.service';
import { CountByNameDto, EventTypeCountsDto, RecordsPerGameDto, SchockAusEffectivityTableDto } from '../dto';
import { GameStatisticsService } from '../game/game-statistics.service';
import { PlayerStatisticsService } from '../player/player-statistics.service';
import { RoundStatisticsService } from '../round/round-statistics.service';
import { addRanking, findPropertyById } from '../statistics.utils';

@Injectable()
export class EventTypesStatisticsService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @InjectRepository(EventType) private readonly eventTypeRepo: Repository<EventType>,
    private gameStatisticsService: GameStatisticsService,
    @Inject(forwardRef(() => RoundStatisticsService)) private roundStatisticsService: RoundStatisticsService,
    private playerStatisticsService: PlayerStatisticsService,
    @Inject(forwardRef(() => AttendanceStatisticsService)) private attendanceStatisticsService: AttendanceStatisticsService,
  ) {
  }

  @Cached()
  async eventTypes(): Promise<{ id: string; description: string; context: EventTypeContext; trigger: EventTypeTrigger; penaltyValue: number; }[]> {
    return this.eventTypeRepo.find({ select: ['id', 'description', 'context', 'trigger', 'penaltyValue'], withDeleted: true });
  }

  @Cached()
  async getRoundEventTypeIdsWithPenalty(): Promise<string[]> {
    return (await this.eventTypes())
      .filter(type => type.context === EventTypeContext.ROUND && !!type.penaltyValue)
      .map(({ id }) => id);
  }

  @Cached()
  async eventTypeCountsByPlayerId(gameIds: string[], playerIds: string[], eventTypeId: string): Promise<{ rank: number; playerId: string; eventTypeId: string; count: number }[]> {
    const roundIds = await this.roundStatisticsService.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0 || !eventTypeId) {
      return Promise.resolve([]);
    }
    const result = await this.dataSource.query(`
        SELECT "playerId", "eventTypeId", count(*)
        FROM event
        WHERE (
          "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
          OR "gameId" IN (${gameIds.map(id => `'${id}'`).join(',')})
        )
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        AND "eventTypeId" = '${eventTypeId}'
        GROUP BY "playerId", "eventTypeId"
    `);
    return addRanking(
      result.map(({ playerId, eventTypeId, count }) => ({ playerId, eventTypeId, count: +count })),
      ['count'],
      ['desc']
    );
  }

  @Cached()
  async eventTypeCountsWithPenaltySum(gameIds: string[], playerIds: string[]): Promise<{ id: string, description: string, count: number, penaltyUnit: PenaltyUnit, penalty: number }[]> {
    const roundIds = await this.roundStatisticsService.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }
    const result = await this.dataSource.query(`
        SELECT event_type.id, description, count(event.id), event."penaltyUnit", SUM("multiplicatorValue" * event."penaltyValue") AS penalty
        FROM event_type
        LEFT JOIN event ON event_type.id = event."eventTypeId"
        WHERE (
            "roundId" IN (${roundIds.map(id => `'${id}'`).join(',')})
            OR "gameId" IN (${gameIds.map(id => `'${id}'`).join(',')})
        )
        AND "playerId" IN (${playerIds.map(id => `'${id}'`).join(',')})
        GROUP BY event_type.id, description, event."penaltyUnit"
    `);

    return result.map(({ id, description, count, penaltyUnit, penalty }) => ({ id, description, count: +count, penaltyUnit, penalty: +penalty }));
  }

  @Cached()
  async maxEventCounts(gameIds: string[], playerIds: string[]): Promise<{ count: number; eventTypeId: string; gameId: string; playerId: string; }[]> {
    if (gameIds.length === 0 || playerIds.length === 0) {
      return Promise.resolve([]);
    }

    const result = await this.dataSource.query(`
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

    return result.map(({ playerId, gameId, eventTypeId, count }) => ({ playerId, gameId, eventTypeId, count: +count }));
  }

  @Cached()
  async schockAusEffectivity(gameIds: string[], playerIds: string[]): Promise<{ roundId: string; playerId: string; sasCount: number }[]> {
    const roundIds = await this.roundStatisticsService.roundIds(gameIds);
    if (gameIds.length === 0 || roundIds.length === 0) {
      return Promise.resolve([]);
    }

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

  async recordsPerGame(gameIds: string[], onlyActivePlayers: boolean): Promise<RecordsPerGameDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);
    const eventTypes = await this.eventTypes();
    const games = await this.gameStatisticsService.games(gameIds);

    const maxEventCounts = await this.maxEventCounts(gameIds, playerIds);
    return Object.keys(EventTypeTrigger)
      .map(key => {
        const eventTypeId = eventTypes.find(t => t.trigger === key)?.id;
        return {
          eventTypeId,
          description: findPropertyById(eventTypes, eventTypeId, 'description'),
          records: maxEventCounts.filter(i => i.eventTypeId === eventTypeId),
        };
      })
      .map(item => {
        return {
          ...item,
          records: item.records.map(({ count, gameId, playerId }) => {
            return {
              count,
              gameId,
              playerId,
              name: findPropertyById(players, playerId, 'name'),
              datetime: findPropertyById(games, gameId, 'datetime'),
            };
          })
        };
      });
  }

  async eventTypeCountsByPlayer(gameIds: string[], onlyActivePlayers: boolean, eventTypeId: string): Promise<CountByNameDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);
    const attendances = await this.attendanceStatisticsService.attendancesByPlayerId(gameIds, playerIds);

    return (await this.eventTypeCountsByPlayerId(gameIds, playerIds, eventTypeId)).map(({ playerId, count }) => ({
      id: playerId,
      name: findPropertyById(players, playerId, 'name'),
      count,
      quote: count / attendances.find(item => item.playerId === playerId)?.count
    }));
  }

  async eventTypeCounts(gameIds: string[], onlyActivePlayers: boolean): Promise<EventTypeCountsDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    return this.eventTypeCountsWithPenaltySum(gameIds, playerIds);
  }

  async schockAusEffectivityTable(gameIds: string[], onlyActivePlayers: boolean): Promise<SchockAusEffectivityTableDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);

    const result = await this.schockAusEffectivity(gameIds, playerIds);
    const grouped = groupBy(result, 'playerId');
    return addRanking(
      Object.entries(grouped).map(([playerId, info]) => {
        const saCount = info.length;
        const sasCount = sumBy(info, 'sasCount');
        return {
          playerId,
          name: findPropertyById(players, playerId, 'name'),
          saCount,
          sasCount,
          quote: sasCount / saCount,
        };
      }),
      ['quote', 'saCount'],
      ['desc', 'desc']
    );
  }

}
