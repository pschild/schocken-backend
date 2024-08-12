import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { SoftRemoveEvent } from 'typeorm/subscriber/event/SoftRemoveEvent';
import { EventType } from '../model/event-type.entity';

/**
 * https://stackoverflow.com/questions/58918644/nestjs-cannot-inject-a-service-into-a-subscriber
 * https://medium.com/@oskralvarez814/auditing-changes-with-nestjs-and-typeorm-059415e329f2
 * https://github.com/erotourtes/React-App/blob/16acda38d38490850760bb4dfac04e9eef506f0c/backend/src/history/task/tasks.dbsubscriber.ts#L24
 */

@Injectable()
@EventSubscriber()
export class EventTypeRevisionSubscriber implements EntitySubscriberInterface {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    // private readonly eventTypeService: EventTypeService
  ) {
    dataSource.subscribers.push(this);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): Function | string {
    return EventType;
  }

  afterInsert(event: InsertEvent<EventType>): Promise<unknown> | void {
    console.log('afterInsert', event.entityId);
  }

  afterUpdate(event: UpdateEvent<EventType>): Promise<unknown> | void {
    console.log('afterUpdate', event.entity.id);
  }

  afterSoftRemove(event: SoftRemoveEvent<EventType>): Promise<unknown> | void {
    console.log('afterSoftRemove', event.entityId);
  }
}
