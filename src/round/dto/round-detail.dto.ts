import { EventTypeTrigger } from '../../event-type/enum/event-type-trigger.enum';
import { EventDetailDto } from '../../event/dto/event-detail.dto';
import { EventPenaltyDto } from '../../event/dto/event-penalty.dto';
import { Round } from '../../model/round.entity';
import { PenaltyDto } from '../../penalty/dto/penalty.dto';
import { summarizePenalties } from '../../penalty/penalty.utils';
import { PlayerDetailDto } from '../../player/dto/player-detail.dto';

export class RoundDetailDto {
  id: string;
  datetime: string;
  attendees?: { id: string }[];
  finalists?: { id: string }[];
  events: EventDetailDto[];
  penalties: PenaltyDto[];
  schockAusCount: number;
  hasFinal: boolean;

  static fromEntity(entity: Round): RoundDetailDto {
    return entity ? {
      id: entity.id,
      datetime: entity.datetime.toISOString(),
      attendees: PlayerDetailDto.fromEntities(entity.attendees).map(player => ({ id: player.id })),
      finalists: PlayerDetailDto.fromEntities(entity.finalists).map(player => ({ id: player.id })),
      events: EventDetailDto.fromEntities(entity.events),
      penalties: summarizePenalties(EventPenaltyDto.fromEntities(entity.events)),
      schockAusCount: entity.events.filter(event => event.eventType.trigger === EventTypeTrigger.SCHOCK_AUS)?.length || 0,
      hasFinal: entity.finalists && entity.finalists.length > 0,
    } : null;
  }

  static fromEntities(entities: Round[]): RoundDetailDto[] {
    return entities.map(e => RoundDetailDto.fromEntity(e));
  }
}
