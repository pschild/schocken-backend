import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../model/event-type.entity';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class EventTypeDetailDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiPropertyOptional({ enum: EventTypeTrigger, example: EventTypeTrigger.SCHOCK_AUS })
  trigger?: EventTypeTrigger;

  @ApiPropertyOptional({ type: String, example: 'Augenzahl' })
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
