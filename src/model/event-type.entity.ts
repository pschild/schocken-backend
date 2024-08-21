import { Column, Entity, OneToMany } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeTrigger } from '../event-type/enum/event-type-trigger.enum';
import { PenaltyUnit } from '../event-type/enum/penalty-unit.enum';
import { BaseEntity } from './base.entity';
import { EventTypeRevision } from './event-type-revision.entity';

@Entity({ name: 'event_type' })
export class EventType extends BaseEntity {
  @Column({ unique: true, length: 64 })
  description: string;

  @Column({ type: 'enum', enum: EventTypeContext })
  context: EventTypeContext;

  @Column({ type: 'enum', enum: EventTypeTrigger, nullable: true })
  trigger: EventTypeTrigger;

  @Column({ type: 'float', nullable: true })
  penaltyValue: number;

  @Column({ type: 'enum', enum: PenaltyUnit, nullable: true })
  penaltyUnit: PenaltyUnit;

  @OneToMany(() => EventTypeRevision, revision => revision.eventType)
  revisions: EventTypeRevision[];

  @Column({ nullable: true, length: 32 })
  multiplicatorUnit: string;

  @Column({ default: false })
  hasComment: boolean;

  @Column()
  order: number;
}
