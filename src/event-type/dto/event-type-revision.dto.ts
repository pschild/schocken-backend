import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventTypeRevision } from '../../model/event-type-revision.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeRevisionType } from '../enum/event-type-revision-type.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';
import { EventTypeDto } from './event-type.dto';

export class EventTypeRevisionDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: EventTypeRevisionType, example: EventTypeRevisionType.UPDATE })
  type: EventTypeRevisionType;

  @ApiProperty({ type: Date })
  createDateTime: string;

  @ApiProperty({ type: Date })
  lastChangedDateTime: string;

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

  @ApiPropertyOptional({ type: String })
  multiplicatorUnit?: string;

  @ApiProperty({ type: Boolean })
  hasComment: boolean;

  @ApiProperty({ type: () => EventTypeDto })
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
