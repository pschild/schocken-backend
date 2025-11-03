import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameDetailService } from '../game/game-detail.service';
import { EventTypeStreakModeEnum } from '../statistics/streak/enum/event-type-streak-mode.enum';
import { PenaltyStreakModeEnum } from '../statistics/streak/enum/penalty-streak-mode.enum';
import { StreakStatisticsService } from '../statistics/streak/streak-statistics.service';
import { DashboardStreaksResponseDto } from './dashboard.controller';

@Injectable()
export class DashboardService {

  constructor(
    private streakStatisticsService: StreakStatisticsService,
    private gameDetailService: GameDetailService,
  ) {
  }
  
  async getCurrentStreaksByUser(playerId: string): Promise<DashboardStreaksResponseDto> {
    const gameIds = await firstValueFrom(this.gameDetailService.findAll().pipe(
      map(games => games.map(game => game.id))
    ));
    
    const [noEventTypeStreaks, eventTypeStreaks, noPenaltyStreaks, penaltyStreaks, attendanceStreaks] = await Promise.all([
      this.streakStatisticsService.eventTypeStreaks(gameIds, true, EventTypeStreakModeEnum.WITHOUT_EVENT),
      this.streakStatisticsService.eventTypeStreaks(gameIds, true, EventTypeStreakModeEnum.WITH_EVENT),
      this.streakStatisticsService.penaltyStreak(gameIds, true, PenaltyStreakModeEnum.NO_PENALTY),
      this.streakStatisticsService.penaltyStreak(gameIds, true, PenaltyStreakModeEnum.AT_LEAST_ONE_PENALTY),
      this.streakStatisticsService.attendanceStreak(gameIds, true),
    ]);

    return {
      noEventTypeStreaks: noEventTypeStreaks
        .map(i => ({ ...i, streaks: i.streaks.filter(s => s.playerId === playerId) }))
        .filter(i => i.streaks.some(s => s.currentStreak > 0)),
      eventTypeStreaks: eventTypeStreaks
        .map(i => ({ ...i, streaks: i.streaks.filter(s => s.playerId === playerId) }))
        .filter(i => i.streaks.some(s => s.currentStreak > 0)),
      noPenaltyStreaks: noPenaltyStreaks
        .filter(s => s.playerId === playerId && s.currentStreak > 0),
      penaltyStreaks: penaltyStreaks
        .filter(s => s.playerId === playerId && s.currentStreak > 0),
      attendanceStreaks: attendanceStreaks
        .filter(s => s.playerId === playerId && s.currentStreak > 0)
    };
  }

}
