import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEvent } from '../model/game-event.entity';
import { GameEventService } from './game-event.service';
import { GameEventController } from './game-event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameEvent])],
  controllers: [GameEventController],
  providers: [GameEventService],
})
export class GameEventModule {}
