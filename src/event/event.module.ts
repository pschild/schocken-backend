import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypeModule } from '../event-type/event-type.module';
import { GameModule } from '../game/game.module';
import { Event } from '../model/event.entity';
import { RoundModule } from '../round/round.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    GameModule,
    RoundModule,
    EventTypeModule
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
