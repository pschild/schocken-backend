import { Column, Entity } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeTrigger } from '../event-type/enum/event-type-trigger.enum';
import { BaseEntity } from './base.entity';

@Entity({ name: 'event_type' })
export class EventType extends BaseEntity {
  @Column({ length: 64 })
  description: string;

  @Column({ type: 'enum', enum: EventTypeContext })
  context: EventTypeContext;

  @Column({ type: 'enum', enum: EventTypeTrigger, nullable: true })
  trigger: EventTypeTrigger;

  // TODO: penalty
  // TODO: history

  @Column({ nullable: true, length: 32 })
  multiplicatorUnit: string;

  @Column({ default: false })
  hasComment: boolean;

  @Column()
  order: number;
}
