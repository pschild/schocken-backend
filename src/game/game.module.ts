import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../model/game.entity';
import { PaymentModule } from '../payment/payment.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { WhatsAppModule } from '../whats-app/whats-app.module';
import { GameDetailService } from './game-detail.service';
import { GameDetailController } from './game-detail.controller';
import { GameNotificationService } from './game-notification.service';
import { GameOverviewController } from './game-overview.controller';
import { GameOverviewService } from './game-overview.service';

@Module({
  imports: [TypeOrmModule.forFeature([Game]), WhatsAppModule, StatisticsModule, PaymentModule],
  controllers: [GameOverviewController, GameDetailController],
  providers: [GameDetailService, GameOverviewService, GameNotificationService],
  exports: [GameDetailService]
})
export class GameModule {}
