import { EventTypeDetailDto } from '../../event-type/dto/event-type-detail.dto';
import { Event } from '../../model/event.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { PlayerDetailDto } from '../../player/dto/player-detail.dto';
import { EventContext } from '../enum/event-context.enum';

export class EventDetailDto {
  id: string;
  datetime: string;
  multiplicatorValue: number;
  penaltyValue?: number;
  penaltyUnit?: PenaltyUnit;
  comment: string;
  context: EventContext;
  player: { id: string };
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
      player: { id: PlayerDetailDto.fromEntity(entity.player).id },
      eventType: EventTypeDetailDto.fromEntity(entity.eventType),
    } : null;
  }

  static fromEntities(entities: Event[]): EventDetailDto[] {
    return entities.map(e => EventDetailDto.fromEntity(e));
  }
}
