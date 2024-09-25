import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventTypeDetailDto } from '../../event-type/dto/event-type-detail.dto';
import { Event } from '../../model/event.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { PlayerDetailDto } from '../../player/dto/player-detail.dto';
import { EventContext } from '../enum/event-context.enum';

export class EventDetailDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ type: Number })
  multiplicatorValue: number;

  @ApiPropertyOptional({ type: Number })
  penaltyValue?: number;

  @ApiPropertyOptional({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit?: PenaltyUnit;

  @ApiProperty({ type: String })
  comment: string;

  @ApiProperty({ enum: EventContext, example: EventContext.ROUND })
  context: EventContext;

  @ApiProperty({ type: String, format: 'uuid' })
  playerId: string;

  @ApiProperty({ type: EventTypeDetailDto })
  eventType: EventTypeDetailDto;

  static fromEntity(entity: Event): EventDetailDto {
    return entity ? {
      id: entity.id,
      datetime: entity.datetime.toISOString(),
      multiplicatorValue: +entity.multiplicatorValue,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
      comment: entity.comment,
      context: entity.context,
      playerId: PlayerDetailDto.fromEntity(entity.player).id,
      eventType: EventTypeDetailDto.fromEntity(entity.eventType),
    } : null;
  }

  static fromEntities(entities: Event[]): EventDetailDto[] {
    return entities.map(e => EventDetailDto.fromEntity(e));
  }
}
