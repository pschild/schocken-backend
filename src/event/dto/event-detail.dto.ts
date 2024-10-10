import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventTypeDetailDto } from '../../event-type/dto/event-type-detail.dto';
import { Event } from '../../model/event.entity';
import { PenaltyDto } from '../../penalty/dto/penalty.dto';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { summarizePenalty } from '../../penalty/penalty.utils';
import { PlayerDetailDto } from '../../player/dto/player-detail.dto';
import { EventContext } from '../enum/event-context.enum';
import { EventPenaltyDto } from './event-penalty.dto';

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

  @ApiProperty({ type: PenaltyDto })
  calculatedPenalty: PenaltyDto;

  @ApiProperty({ type: String })
  comment: string;

  @ApiProperty({ enum: EventContext, example: EventContext.ROUND })
  context: EventContext;

  @ApiProperty({ type: String, format: 'uuid' })
  playerId: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  gameId?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  roundId?: string;

  @ApiProperty({ type: EventTypeDetailDto })
  eventType: EventTypeDetailDto;

  static fromEntity(entity: Event): EventDetailDto {
    return entity ? {
      id: entity.id,
      datetime: entity.datetime.toISOString(),
      multiplicatorValue: +entity.multiplicatorValue,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
      calculatedPenalty: summarizePenalty(EventPenaltyDto.fromEntity(entity)),
      comment: entity.comment,
      context: entity.context,
      playerId: PlayerDetailDto.fromEntity(entity.player).id,
      gameId: entity.game?.id,
      roundId: entity.round?.id,
      eventType: EventTypeDetailDto.fromEntity(entity.eventType),
    } : null;
  }

  static fromEntities(entities: Event[]): EventDetailDto[] {
    return entities.map(e => EventDetailDto.fromEntity(e));
  }
}
