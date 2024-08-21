import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { SoftRemoveEvent } from 'typeorm/subscriber/event/SoftRemoveEvent';
import { EventType } from '../model/event-type.entity';
import { CreateEventTypeRevisionDto } from './dto/create-event-type-revision.dto';
import { EventTypeRevisionType } from './enum/event-type-revision-type.enum';
import { EventTypeRevisionService } from './event-type-revision.service';

/**
 * https://stackoverflow.com/questions/58918644/nestjs-cannot-inject-a-service-into-a-subscriber
 * https://medium.com/@oskralvarez814/auditing-changes-with-nestjs-and-typeorm-059415e329f2
 * https://github.com/erotourtes/React-App/blob/16acda38d38490850760bb4dfac04e9eef506f0c/backend/src/history/task/tasks.dbsubscriber.ts#L24
 *
 * https://stackoverflow.com/questions/54246615/what-s-the-difference-between-remove-and-delete
 */

@Injectable()
@EventSubscriber()
export class EventTypeRevisionSubscriber implements EntitySubscriberInterface {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    private readonly revisionService: EventTypeRevisionService
  ) {
    dataSource.subscribers.push(this);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): Function | string {
    return EventType;
  }

  afterInsert(event: InsertEvent<EventType>): Promise<unknown> | void {
    this.revisionService.create(this.createEntity(event.entity, EventTypeRevisionType.INSERT));
  }

  afterUpdate(event: UpdateEvent<EventType>): Promise<unknown> | void {
    this.revisionService.create(this.createEntity(event.entity as EventType, EventTypeRevisionType.UPDATE));
  }

  afterSoftRemove(event: SoftRemoveEvent<EventType>): Promise<unknown> | void {
    this.revisionService.create(this.createEntity(event.entity, EventTypeRevisionType.REMOVE));
  }

  private createEntity(entity: EventType, type: EventTypeRevisionType): CreateEventTypeRevisionDto {
    const originalEntity = { ...entity };
    const eventTypeId = originalEntity.id.toString();
    delete originalEntity.id;
    delete originalEntity.createDateTime;

    return {
      ...originalEntity,
      type,
      eventTypeId,
    };
  }
}
