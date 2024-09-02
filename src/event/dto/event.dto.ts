import { EventTypeDto } from '../../event-type/dto/event-type.dto';
import { PenaltyUnit } from '../../event-type/enum/penalty-unit.enum';
import { GameDto } from '../../game/dto/game.dto';
import { Event } from '../../model/event.entity';
import { PlayerDto } from '../../player/dto/player.dto';
import { RoundDto } from '../../round/dto/round.dto';
import { EventContext } from '../enum/event-context.enum';

export class EventDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  datetime: string;
  multiplicatorValue: number;
  penaltyValue?: number;
  penaltyUnit?: PenaltyUnit;
  comment: string;
  context: EventContext;
  game?: GameDto;
  round?: RoundDto;
  player: PlayerDto;
  eventType: EventTypeDto;

  static fromEntity(entity: Event): EventDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      multiplicatorValue: +entity.multiplicatorValue,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
      comment: entity.comment,
      context: entity.context,
      ...(entity.game ? { game: GameDto.fromEntity(entity.game) } : {}),
      ...(entity.round ? { round: RoundDto.fromEntity(entity.round) } : {}),
      player: PlayerDto.fromEntity(entity.player),
      eventType: EventTypeDto.fromEntity(entity.eventType),
    } : null;
  }

  static fromEntities(entities: Event[]): EventDto[] {
    return entities.map(e => EventDto.fromEntity(e));
  }
}
