import { Injectable } from '@nestjs/common';
import { groupBy, maxBy } from 'lodash';
import { EventTypeTrigger } from '../../event-type/enum/event-type-trigger.enum';
import { EventTypeStreakDto, SchockAusStreakDto, StreakDto } from '../dto';
import { EventTypesStatisticsService } from '../event-types/event-types-statistics.service';
import { GameStatisticsService } from '../game/game-statistics.service';
import { PlayerStatisticsService } from '../player/player-statistics.service';
import { RoundStatisticsService } from '../round/round-statistics.service';
import { addRanking, findPropertyById } from '../statistics.utils';
import { EventTypeStreakModeEnum } from './enum/event-type-streak-mode.enum';
import { PenaltyStreakModeEnum } from './enum/penalty-streak-mode.enum';
import { calculateCurrentStreak, calculateMaxStreak } from './streak.utils';

@Injectable()
export class StreakStatisticsService {

  /**
   * Bestimmt, ob es bei gleicher Höhe "besser" ist, einen Rekord initial aufgestellt (`false`) oder ihn eingestellt zu haben (`true`).
   */
  private LATEST_RECORDS_FIRST = true;

  constructor(
    private playerStatisticsService: PlayerStatisticsService,
    private eventTypesStatisticsService: EventTypesStatisticsService,
    private gameStatisticsService: GameStatisticsService,
    private roundStatisticsService: RoundStatisticsService,
  ) {
  }

  async eventTypeStreaks(gameIds: string[], onlyActivePlayers: boolean, mode: EventTypeStreakModeEnum): Promise<EventTypeStreakDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);
    const eventTypes = await this.eventTypesStatisticsService.eventTypes();
    const rounds = await this.roundStatisticsService.rounds(gameIds);

    const allRoundIdsForPlayer = await Promise.all(playerIds.map(playerId => {
      return this.roundStatisticsService.getOrderedRoundIdsByPlayerId(gameIds, playerId).then(roundIds => {
        return { playerId, roundIds };
      });
    }));

    const eventTypeIds = eventTypes
      .filter(({ trigger }) => [EventTypeTrigger.VERLOREN, EventTypeTrigger.SCHOCK_AUS, EventTypeTrigger.SCHOCK_AUS_STRAFE, EventTypeTrigger.LUSTWURF, EventTypeTrigger.ZWEI_ZWEI_EINS].includes(trigger))
      .map(({ id }) => id);

    const roundIdsByPlayerAndEventType = await Promise.all(
      playerIds.map(playerId => {
        return eventTypeIds.map(eventTypeId => {
          return this.roundStatisticsService.getRoundIdsByPlayerAndEventType(gameIds, eventTypeId, playerId, mode)
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
        playerId,
        name: findPropertyById(players, playerId, 'name'),
        eventTypeId,
        maxStreak: streak.length,
        currentStreak: calculateCurrentStreak(allRoundIds, roundIds),
        isCurrent: lastAttendedRoundId === lastRoundIdOfStreak,
        lastRoundIdOfStreak,
        datetime: findPropertyById(rounds, lastRoundIdOfStreak, 'datetime'),
        gameId: findPropertyById(rounds, lastRoundIdOfStreak, 'gameId'),
      };
    });

    const groupedByEventTypeId = groupBy(streaks, 'eventTypeId');
    return Object.entries(groupedByEventTypeId)
      .map(([eventTypeId, streaks]) => ({
        eventTypeId,
        description: findPropertyById(eventTypes, eventTypeId, 'description'),
        mode,
        streaks: addRanking(
          streaks,
          ['maxStreak', 'datetime'],
          ['desc', this.LATEST_RECORDS_FIRST ? 'desc' : 'asc']
        ).map(({ rank, playerId, name, maxStreak, currentStreak, isCurrent, lastRoundIdOfStreak, datetime, gameId }) => ({ rank, playerId, name, maxStreak, currentStreak, isCurrent, lastRoundIdOfStreak, datetime, gameId }))
      }))
      .map(result => {
        const overallHighscore = result.streaks.find(s => s.rank === 1);
        return {
          ...result,
          streaks: result.streaks.map(streak => ({ ...streak, overallHighscore }))
        };
      });
  }

  async penaltyStreak(gameIds: string[], onlyActivePlayers: boolean, mode: PenaltyStreakModeEnum): Promise<StreakDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);
    const rounds = await this.roundStatisticsService.rounds(gameIds);

    const allRoundIdsForPlayer = await Promise.all(playerIds.map(playerId => {
      return this.roundStatisticsService.getOrderedRoundIdsByPlayerId(gameIds, playerId).then(roundIds => {
        return { playerId, roundIds };
      });
    }));

    const roundIdsByPlayer = await Promise.all(playerIds.map(playerId => {
      return this.roundStatisticsService.getRoundIdsByPlayerAndAnyPenalty(gameIds, playerId, mode).then(roundIds => {
        return { playerId, roundIds };
      })
    }));

    const streaks = roundIdsByPlayer.map(({ playerId, roundIds }) => {
      const allRoundIds = allRoundIdsForPlayer.find(i => i.playerId === playerId).roundIds;
      const streak = calculateMaxStreak(allRoundIds, roundIds);
      const lastAttendedRoundId = allRoundIds[allRoundIds.length - 1];
      const lastRoundIdOfStreak = streak[streak.length - 1];
      return {
        playerId,
        name: findPropertyById(players, playerId, 'name'),
        maxStreak: streak.length,
        currentStreak: calculateCurrentStreak(allRoundIds, roundIds),
        isCurrent: lastAttendedRoundId === lastRoundIdOfStreak,
        lastRoundIdOfStreak,
        datetime: findPropertyById(rounds, lastRoundIdOfStreak, 'datetime'),
        gameId: findPropertyById(rounds, lastRoundIdOfStreak, 'gameId'),
      };
    });

    const ranked = addRanking(streaks, ['maxStreak', 'datetime'], ['desc', this.LATEST_RECORDS_FIRST ? 'desc' : 'asc']);
    const overallHighscore = ranked.find(s => s.rank === 1);
    return ranked.map(item => ({
      ...item,
      overallHighscore,
    }));
  }

  async getSchockAusStreak(gameIds: string[]): Promise<SchockAusStreakDto> {
    const games = await this.gameStatisticsService.games(gameIds);
    const eventTypes = await this.eventTypesStatisticsService.eventTypes();
    const schockAusEventTypeId = eventTypes.find(t => t.trigger === EventTypeTrigger.SCHOCK_AUS).id;

    const roundIdsByGameId = await this.roundStatisticsService.roundIdsByGameId(gameIds);
    const roundIdsBySchockAus = await this.roundStatisticsService.roundIdsByEventTypeId(gameIds, schockAusEventTypeId);
    const streaks = roundIdsByGameId.map(({ gameId, roundIds }) => {
      const schockAusRoundIds = roundIdsBySchockAus.find(i => i.gameId === gameId)?.roundIds || [];
      const streak = calculateMaxStreak(roundIds, schockAusRoundIds);
      return {
        gameId,
        datetime: findPropertyById(games, gameId, 'datetime'),
        maxStreak: streak.length
      };
    });
    return maxBy(streaks, 'maxStreak');
  }

  async attendanceStreak(gameIds: string[], onlyActivePlayers: boolean): Promise<StreakDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);
    const rounds = await this.roundStatisticsService.rounds(gameIds);
    const allRoundIds = await this.roundStatisticsService.roundIds(gameIds);

    const allRoundIdsForPlayer = await Promise.all(playerIds.map(playerId => {
      return this.roundStatisticsService.getOrderedRoundIdsByPlayerId(gameIds, playerId).then(roundIds => {
        return { playerId, roundIds };
      });
    }));

    const streaks = allRoundIdsForPlayer.map(({ playerId, roundIds }) => {
      const streak = calculateMaxStreak(allRoundIds, roundIds);
      const lastAttendedRoundId = roundIds[roundIds.length - 1];
      const lastRoundIdOfStreak = streak[streak.length - 1];
      return {
        playerId,
        name: findPropertyById(players, playerId, 'name'),
        maxStreak: streak.length,
        currentStreak: calculateCurrentStreak(allRoundIds, roundIds),
        isCurrent: lastAttendedRoundId === lastRoundIdOfStreak,
        lastRoundIdOfStreak,
        datetime: findPropertyById(rounds, lastRoundIdOfStreak, 'datetime'),
        gameId: findPropertyById(rounds, lastRoundIdOfStreak, 'gameId'),
      };
    });

    const ranked = addRanking(streaks, ['maxStreak', 'datetime'], ['desc', this.LATEST_RECORDS_FIRST ? 'desc' : 'asc']);
    const overallHighscore = ranked.find(item => item.rank === 1);
    return ranked.map(item => ({
      ...item,
      overallHighscore,
    }));
  }

}
