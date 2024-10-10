import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../model/game.entity';
import { GameDetailService } from './game-detail.service';
import { GameDetailsController } from './game-details.controller';
import { GameOverviewController } from './game-overview.controller';
import { GameOverviewService } from './game-overview.service';
import { GameService } from './game.service';
import { GameController } from './game.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Game])],
  controllers: [GameController, GameOverviewController, GameDetailsController],
  providers: [GameService, GameDetailService, GameOverviewService],
  exports: [GameService]
})
export class GameModule {}
