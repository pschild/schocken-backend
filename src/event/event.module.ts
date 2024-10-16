import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypeModule } from '../event-type/event-type.module';
import { GameModule } from '../game/game.module';
import { Event } from '../model/event.entity';
import { RoundModule } from '../round/round.module';
import { EventDetailsController } from './event-detail.controller';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventEntitySubscriber } from './event.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    GameModule,
    RoundModule,
    EventTypeModule
  ],
  controllers: [EventController, EventDetailsController],
  providers: [EventService, EventEntitySubscriber],
})
export class EventModule {}
