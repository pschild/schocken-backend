import { EventType } from '../../model/event-type.entity';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class EventTypeDetailDto {
  id: string;
  description: string;
  trigger?: EventTypeTrigger;
  multiplicatorUnit?: string;

  static fromEntity(entity: EventType): EventTypeDetailDto {
    return entity ? {
      id: entity.id,
      description: entity.description,
      trigger: entity.trigger,
      multiplicatorUnit: entity.multiplicatorUnit,
    } : null;
  }

  static fromEntities(entities: EventType[]): EventTypeDetailDto[] {
    return entities.map(e => EventTypeDetailDto.fromEntity(e));
  }
}
