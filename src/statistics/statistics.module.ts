import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { Event } from '../model/event.entity';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Round, Event, Player])],
  controllers: [StatisticsController],
  providers: [StatisticsService]
})
export class StatisticsModule {}
