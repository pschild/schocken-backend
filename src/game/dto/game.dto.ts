import { EventDto } from '../../event/dto/event.dto';
import { Game } from '../../model/game.entity';
import { RoundDto } from '../../round/dto/round.dto';
import { PlaceType } from '../enum/place-type.enum';
import { PlaceDto } from './place.dto';

export class GameDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  datetime: string;
  completed: boolean;
  excludeFromStatistics: boolean;
  place?: PlaceDto;
  rounds?: RoundDto[];
  events?: EventDto[];

  static fromEntity(entity: Game): GameDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      completed: entity.completed,
      excludeFromStatistics: entity.excludeFromStatistics,
      place: GameDto.mapPlace(entity),
      ...(entity.rounds ? { rounds: RoundDto.fromEntities(entity.rounds) } : {}),
      ...(entity.events ? { events: EventDto.fromEntities(entity.events) } : {}),
    } : null;
  }

  static fromEntities(entities: Game[]): GameDto[] {
    return entities.map(e => GameDto.fromEntity(e));
  }

  static mapPlace(entity: Game): PlaceDto {
    return {
      type: entity.placeType,
      location: GameDto.mapLocation(entity)
    }
  }

  private static mapLocation(entity: Game): string {
    switch (entity.placeType) {
      case PlaceType.HOME:
        return entity.hostedBy.name;
      case PlaceType.AWAY:
        return entity.placeOfAwayGame;
      case PlaceType.REMOTE:
        return null;
    }
  }
}
