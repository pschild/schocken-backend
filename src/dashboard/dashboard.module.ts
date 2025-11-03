import { Module } from '@nestjs/common';
import { GameModule } from '../game/game.module';
import { PlayerModule } from '../player/player.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [StatisticsModule, GameModule, PlayerModule],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
