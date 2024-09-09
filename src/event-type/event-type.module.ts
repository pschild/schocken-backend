import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { EventTypeOverviewController } from './event-type-overview.controller';
import { EventTypeRevisionSubscriber } from './event-type-revision.subscriber';
import { EventTypeService } from './event-type.service';
import { EventTypeController } from './event-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventType, EventTypeRevision])],
  controllers: [EventTypeController, EventTypeOverviewController],
  providers: [EventTypeService, EventTypeRevisionSubscriber],
  exports: [EventTypeService]
})
export class EventTypeModule {}
