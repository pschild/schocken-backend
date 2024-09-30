import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../model/event-type.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';
import { EventTypeRevisionDto } from './event-type-revision.dto';

export class EventTypeDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  createDateTime: string;

  @ApiProperty({ type: Date })
  lastChangedDateTime: string;

  @ApiProperty({ type: Boolean })
  isDeleted: boolean;

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

  @ApiPropertyOptional({ type: [EventTypeRevisionDto] })
  revisions?: EventTypeRevisionDto[];

  @ApiPropertyOptional({ type: String, example: 'Augenzahl' })
  multiplicatorUnit?: string;

  @ApiProperty({ type: Boolean })
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
      penaltyValue: entity.penaltyValue ? +entity.penaltyValue : null,
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
