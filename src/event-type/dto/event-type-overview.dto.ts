import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../model/event-type.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class EventTypeOverviewDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ enum: EventTypeContext, example: EventTypeContext.ROUND })
  context: EventTypeContext;

  @ApiPropertyOptional({ enum: EventTypeTrigger, example: EventTypeTrigger.SCHOCK_AUS })
  trigger?: EventTypeTrigger;

  @ApiPropertyOptional({ type: Number })
  penaltyValue?: number;

  @ApiPropertyOptional({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit?: PenaltyUnit;

  @ApiPropertyOptional({ type: String, example: 'Augenzahl' })
  multiplicatorUnit?: string;

  @ApiProperty({ type: Boolean })
  hasComment: boolean;

  @ApiPropertyOptional({ type: Number })
  eventCount: number;

  static fromEntity(entity: EventType & { count: number }): EventTypeOverviewDto {
    return entity ? {
      id: entity.id,
      description: entity.description,
      context: entity.context,
      trigger: entity.trigger,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
      multiplicatorUnit: entity.multiplicatorUnit,
      hasComment: entity.hasComment,
      eventCount: +entity.count,
    } : null;
  }

  static fromEntities(entities: (EventType & { count: number })[]): EventTypeOverviewDto[] {
    return entities.map(e => EventTypeOverviewDto.fromEntity(e));
  }
}
