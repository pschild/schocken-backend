import { EventType } from '../../model/event-type.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { EventTypeContext } from '../enum/event-type-context.enum';

export class EventTypeOverviewDto {
  id: string;
  description: string;
  context: EventTypeContext;
  penaltyValue?: number;
  penaltyUnit?: PenaltyUnit;
  multiplicatorUnit?: string;
  eventCount: number;

  static fromEntity(entity: EventType & { count: number }): EventTypeOverviewDto {
    return entity ? {
      id: entity.id,
      description: entity.description,
      context: entity.context,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
      multiplicatorUnit: entity.multiplicatorUnit,
      eventCount: +entity.count,
    } : null;
  }

  static fromEntities(entities: (EventType & { count: number })[]): EventTypeOverviewDto[] {
    return entities.map(e => EventTypeOverviewDto.fromEntity(e));
  }
}
