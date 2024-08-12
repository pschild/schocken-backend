import { EventType } from '../../model/event-type.entity';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class EventTypeDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  description: string;
  context: EventTypeContext;
  trigger?: EventTypeTrigger;
  // TODO: penalty
  // TODO: history
  multiplicatorUnit?: string;
  hasComment: boolean;
  order: number;

  static fromEntity(entity: EventType): EventTypeDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      description: entity.description,
      context: entity.context,
      trigger: entity.trigger,
      multiplicatorUnit: entity.multiplicatorUnit,
      hasComment: entity.hasComment,
      order: entity.order,
    } : null;
  }

  static fromEntities(entities: EventType[]): EventTypeDto[] {
    return entities.map(e => EventTypeDto.fromEntity(e));
  }
}
