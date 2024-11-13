import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventTypeTrigger } from '../../event-type/enum/event-type-trigger.enum';
import { EventDetailDto } from '../../event/dto/event-detail.dto';
import { EventPenaltyDto } from '../../event/dto/event-penalty.dto';
import { Round } from '../../model/round.entity';
import { PenaltyDto } from '../../penalty/dto/penalty.dto';
import { summarizePenalties } from '../../penalty/penalty.utils';
import { PlayerDetailDto } from '../../player/dto/player-detail.dto';
import { getWarnings } from '../round.utils';

export class RoundDetailDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({  type: String, format: 'uuid', isArray: true })
  attendees?: string[];

  @ApiProperty({  type: String, format: 'uuid', isArray: true })
  finalists?: string[];

  @ApiProperty({ type: [EventDetailDto] })
  events: EventDetailDto[];

  @ApiProperty({ type: [PenaltyDto] })
  penalties: PenaltyDto[];

  @ApiProperty({ type: Number })
  schockAusCount: number;

  @ApiProperty({ type: Boolean })
  hasFinal: boolean;

  @ApiPropertyOptional({ type: [String] })
  warnings?: string[];

  static fromEntity(entity: Round): RoundDetailDto {
    return entity ? {
      id: entity.id,
      datetime: entity.datetime.toISOString(),
      attendees: PlayerDetailDto.fromEntities(entity.attendees).map(player => player.id),
      finalists: PlayerDetailDto.fromEntities(entity.finalists).map(player => player.id),
      events: EventDetailDto.fromEntities(entity.events),
      penalties: summarizePenalties(EventPenaltyDto.fromEntities(entity.events)),
      schockAusCount: entity.events.filter(event => event.eventType.trigger === EventTypeTrigger.SCHOCK_AUS)?.length || 0,
      hasFinal: entity.finalists && entity.finalists.length > 0,
      warnings: getWarnings(entity),
    } : null;
  }

  static fromEntities(entities: Round[]): RoundDetailDto[] {
    return entities.map(e => RoundDetailDto.fromEntity(e));
  }
}
