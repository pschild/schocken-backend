import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../model/game.entity';
import { GameDetailService } from './game-detail.service';
import { GameDetailController } from './game-detail.controller';
import { GameOverviewController } from './game-overview.controller';
import { GameOverviewService } from './game-overview.service';

@Module({
  imports: [TypeOrmModule.forFeature([Game])],
  controllers: [GameOverviewController, GameDetailController],
  providers: [GameDetailService, GameOverviewService],
  exports: [GameDetailService]
})
export class GameModule {}
