import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { SoftRemoveEvent } from 'typeorm/subscriber/event/SoftRemoveEvent';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { CreateEventTypeRevisionDto } from './dto/create-event-type-revision.dto';
import { EventTypeRevisionType } from './enum/event-type-revision-type.enum';

/**
 * https://stackoverflow.com/questions/58918644/nestjs-cannot-inject-a-service-into-a-subscriber
 * https://medium.com/@oskralvarez814/auditing-changes-with-nestjs-and-typeorm-059415e329f2
 * https://github.com/erotourtes/React-App/blob/16acda38d38490850760bb4dfac04e9eef506f0c/backend/src/history/task/tasks.dbsubscriber.ts#L24
 *
 * https://stackoverflow.com/questions/54246615/what-s-the-difference-between-remove-and-delete
 *
 * ATTENTION: Calling an external service does not work!
 * See Note at https://github.com/typeorm/typeorm/blob/master/docs/listeners-and-subscribers.md#what-is-a-subscriber:
 *
 * Note: All database operations in the subscribed event listeners should be performed using the event object's queryRunner or manager instance.
 */

@Injectable()
@EventSubscriber()
export class EventTypeRevisionSubscriber implements EntitySubscriberInterface {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): Function | string {
    return EventType;
  }

  afterInsert(event: InsertEvent<EventType>): Promise<unknown> | void {
    const dto = CreateEventTypeRevisionDto.mapForeignKeys(this.createEntity(event.entity, EventTypeRevisionType.INSERT));
    return event.manager.getRepository(EventTypeRevision).save(dto);
  }

  afterUpdate(event: UpdateEvent<EventType>): Promise<unknown> | void {
    const dto = CreateEventTypeRevisionDto.mapForeignKeys(this.createEntity(event.entity as EventType, EventTypeRevisionType.UPDATE));
    return event.manager.getRepository(EventTypeRevision).save(dto);
  }

  afterSoftRemove(event: SoftRemoveEvent<EventType>): Promise<unknown> | void {
    const dto = CreateEventTypeRevisionDto.mapForeignKeys(this.createEntity(event.entity, EventTypeRevisionType.REMOVE));
    return event.manager.getRepository(EventTypeRevision).save(dto);
  }

  private createEntity(entity: EventType, type: EventTypeRevisionType): CreateEventTypeRevisionDto {
    const originalEntity = { ...entity };
    const eventTypeId = originalEntity.id.toString();
    delete originalEntity.id;
    delete originalEntity.createDateTime; // remove this line when migrating from existing JSON files
    delete originalEntity.deletedDateTime;

    return {
      ...originalEntity,
      type,
      eventTypeId,
    };
  }
}
