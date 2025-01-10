import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypeModule } from '../event-type/event-type.module';
import { GameModule } from '../game/game.module';
import { Event } from '../model/event.entity';
import { RoundModule } from '../round/round.module';
import { EventDetailController } from './event-detail.controller';
import { EventDetailService } from './event-detail.service';
import { EventEntitySubscriber } from './event.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    GameModule,
    RoundModule,
    EventTypeModule
  ],
  controllers: [EventDetailController],
  providers: [EventDetailService, EventEntitySubscriber],
})
export class EventModule {}
