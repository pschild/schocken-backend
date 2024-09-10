import { EventType } from '../../model/event-type.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';
import { EventTypeRevisionDto } from './event-type-revision.dto';

export class EventTypeDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  isDeleted: boolean;
  description: string;
  context: EventTypeContext;
  trigger?: EventTypeTrigger;
  penaltyValue?: number;
  penaltyUnit?: PenaltyUnit;
  revisions?: EventTypeRevisionDto[];
  multiplicatorUnit?: string;
  hasComment: boolean;

  static fromEntity(entity: EventType): EventTypeDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      isDeleted: !!entity.deletedDateTime,
      description: entity.description,
      context: entity.context,
      trigger: entity.trigger,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
      ...(entity.revisions ? { revisions: EventTypeRevisionDto.fromEntities(entity.revisions) } : {}),
      multiplicatorUnit: entity.multiplicatorUnit,
      hasComment: entity.hasComment,
    } : null;
  }

  static fromEntities(entities: EventType[]): EventTypeDto[] {
    return entities.map(e => EventTypeDto.fromEntity(e));
  }
}
