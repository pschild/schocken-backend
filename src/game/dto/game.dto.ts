import { GameEventDto } from '../../game-event/dto/game-event.dto';
import { Game } from '../../model/game.entity';
import { PlayerDto } from '../../player/dto/player.dto';
import { RoundDto } from '../../round/dto/round.dto';
import { PlaceType } from '../enum/place-type.enum';

export class GameDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  datetime: string;
  completed: boolean;
  place?: { type: PlaceType; location?: string };
  rounds?: RoundDto[];
  events?: GameEventDto[];

  static fromEntity(entity: Game): GameDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      completed: entity.completed,
      place: GameDto.mapPlace(entity),
      ...(entity.rounds ? { rounds: RoundDto.fromEntities(entity.rounds) } : {}),
      ...(entity.events ? { events: GameEventDto.fromEntities(entity.events) } : {}),
    } : null;
  }

  static fromEntities(entities: Game[]): GameDto[] {
    return entities.map(e => GameDto.fromEntity(e));
  }

  private static mapPlace(entity: Game): { type: PlaceType; location?: string } {
    return {
      type: entity.placeType,
      location: GameDto.mapLocation(entity)
    }
  }

  private static mapLocation(entity: Game): string {
    switch (entity.placeType) {
      case PlaceType.HOME:
        return PlayerDto.fromEntity(entity.hostedBy)?.name;
      case PlaceType.AWAY:
        return entity.placeOfAwayGame;
      case PlaceType.REMOTE:
        return null;
    }
  }
}
