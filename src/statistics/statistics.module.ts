import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventType } from '../model/event-type.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { Event } from '../model/event.entity';
import { AttendanceStatisticsService } from './attendance/attendance-statistics.service';
import { EventTypesStatisticsService } from './event-types/event-types-statistics.service';
import { GameStatisticsService } from './game/game-statistics.service';
import { HostingStatisticsService } from './hosting/hosting-statistics.service';
import { PenaltyStatisticsService } from './penalty/penalty-statistics.service';
import { PlayerStatisticsService } from './player/player-statistics.service';
import { PointsStatisticsService } from './points/points-statistics.service';
import { RoundStatisticsService } from './round/round-statistics.service';
import { StatisticsController } from './statistics.controller';
import { StreakStatisticsService } from './streak/streak-statistics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Round, Event, EventType, Player])],
  controllers: [StatisticsController],
  providers: [
    GameStatisticsService,
    RoundStatisticsService,
    PlayerStatisticsService,
    EventTypesStatisticsService,
    HostingStatisticsService,
    AttendanceStatisticsService,
    PenaltyStatisticsService,
    StreakStatisticsService,
    PointsStatisticsService
  ]
})
export class StatisticsModule {}
