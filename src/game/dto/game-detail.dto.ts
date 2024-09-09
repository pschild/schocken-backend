import { EventDetailDto } from '../../event/dto/event-detail.dto';
import { Game } from '../../model/game.entity';
import { RoundDetailDto } from '../../round/dto/round-detail.dto';
import { PlaceType } from '../enum/place-type.enum';
import { GameDto } from './game.dto';

export class GameDetailDto {
  id: string;
  datetime: string;
  completed: boolean;
  excludeFromStatistics: boolean;
  place: { type: PlaceType; location?: string };
  rounds: RoundDetailDto[];
  events: EventDetailDto[];

  static fromEntity(entity: Game): GameDetailDto {
    return entity ? {
      id: entity.id,
      datetime: entity.datetime.toISOString(),
      completed: entity.completed,
      excludeFromStatistics: entity.excludeFromStatistics,
      place: GameDto.mapPlace(entity),
      rounds: RoundDetailDto.fromEntities(entity.rounds),
      events: EventDetailDto.fromEntities(entity.events),
    } : null;
  }

  static fromEntities(entities: Game[]): GameDetailDto[] {
    return entities.map(e => GameDetailDto.fromEntity(e));
  }
}
