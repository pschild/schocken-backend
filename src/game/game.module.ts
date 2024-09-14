import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../model/game.entity';
import { GameOverviewController } from './game-overview.controller';
import { GameService } from './game.service';
import { GameController } from './game.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Game])],
  controllers: [GameController, GameOverviewController],
  providers: [GameService],
  exports: [GameService]
})
export class GameModule {}
