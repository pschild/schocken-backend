import { EventTypeDto } from '../../event-type/dto/event-type.dto';
import { GameDto } from '../../game/dto/game.dto';
import { GameEvent } from '../../model/game-event.entity';
import { PlayerDto } from '../../player/dto/player.dto';

export class GameEventDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  datetime: string;
  multiplicatorValue: string;
  comment: string;
  game: GameDto;
  player: PlayerDto;
  eventType: EventTypeDto;

  static fromEntity(entity: GameEvent): GameEventDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      multiplicatorValue: entity.multiplicatorValue,
      comment: entity.comment,
      game: GameDto.fromEntity(entity.game),
      player: PlayerDto.fromEntity(entity.player),
      eventType: EventTypeDto.fromEntity(entity.eventType),
    } : null;
  }

  static fromEntities(entities: GameEvent[]): GameEventDto[] {
    return entities.map(e => GameEventDto.fromEntity(e));
  }
}
