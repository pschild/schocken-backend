import { EventTypeRevision } from '../../model/event-type-revision.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeRevisionType } from '../enum/event-type-revision-type.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';
import { EventTypeDto } from './event-type.dto';

export class EventTypeRevisionDto {
  id: string;
  type: EventTypeRevisionType;
  createDateTime: string;
  lastChangedDateTime: string;
  description: string;
  context: EventTypeContext;
  trigger?: EventTypeTrigger;
  penaltyValue?: number;
  penaltyUnit?: PenaltyUnit;
  multiplicatorUnit?: string;
  hasComment: boolean;
  eventType: EventTypeDto;

  static fromEntity(entity: EventTypeRevision): EventTypeRevisionDto {
    return entity ? {
      id: entity.id,
      type: entity.type,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      description: entity.description,
      context: entity.context,
      trigger: entity.trigger,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
      multiplicatorUnit: entity.multiplicatorUnit,
      hasComment: entity.hasComment,
      eventType: EventTypeDto.fromEntity(entity.eventType),
    } : null;
  }

  static fromEntities(entities: EventTypeRevision[]): EventTypeRevisionDto[] {
    return entities.map(e => EventTypeRevisionDto.fromEntity(e));
  }
}
