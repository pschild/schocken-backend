import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeRevisionType } from '../event-type/enum/event-type-revision-type.enum';
import { EventTypeTrigger } from '../event-type/enum/event-type-trigger.enum';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { BaseEntity } from './base.entity';
import { EventType } from './event-type.entity';

@Entity({ name: 'event_type_revision' })
export class EventTypeRevision extends BaseEntity {
  @Column({ type: 'enum', enum: EventTypeRevisionType })
  type: EventTypeRevisionType;

  @Column({ length: 64 })
  description: string;

  @Column({ type: 'enum', enum: EventTypeContext })
  context: EventTypeContext;

  @Column({ type: 'enum', enum: EventTypeTrigger, nullable: true })
  trigger: EventTypeTrigger;

  @Column({ type: 'real', nullable: true })
  penaltyValue: number;

  @Column({ type: 'enum', enum: PenaltyUnit, nullable: true })
  penaltyUnit: PenaltyUnit;

  @Column({ nullable: true, length: 32 })
  multiplicatorUnit: string;

  @Column({ default: false })
  hasComment: boolean;

  @Index()
  @ManyToOne(
    () => EventType,
    eventType => eventType.revisions,
    {
      nullable: false,
      onDelete: 'CASCADE' // remove orphan revisions when referring event type is deleted
    }
  )
  eventType: EventType;
}
