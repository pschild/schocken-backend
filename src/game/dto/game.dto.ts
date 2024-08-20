import { GameEventDto } from '../../game-event/dto/game-event.dto';
import { Game } from '../../model/game.entity';
import { RoundDto } from '../../round/dto/round.dto';
import { PlaceDto } from './place.dto';

export class GameDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  datetime: string;
  completed: boolean;
  place?: PlaceDto;
  rounds?: RoundDto[];
  events?: GameEventDto[];

  static fromEntity(entity: Game): GameDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      completed: entity.completed,
      place: PlaceDto.fromEntity(entity),
      ...(entity.rounds ? { rounds: RoundDto.fromEntities(entity.rounds) } : {}),
      ...(entity.events ? { events: GameEventDto.fromEntities(entity.events) } : {}),
    } : null;
  }

  static fromEntities(entities: Game[]): GameDto[] {
    return entities.map(e => GameDto.fromEntity(e));
  }
}
