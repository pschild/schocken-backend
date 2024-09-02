import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypeModule } from '../event-type/event-type.module';
import { Event } from '../model/event.entity';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    EventTypeModule,
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
