import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventType } from '../model/event-type.entity';
import { EventTypeRevisionSubscriber } from './event-type-revision.subscriber';
import { EventTypeService } from './event-type.service';
import { EventTypeController } from './event-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventType])],
  controllers: [EventTypeController],
  providers: [EventTypeService, EventTypeRevisionSubscriber],
})
export class EventTypeModule {}
