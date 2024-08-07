import { Game } from '../../model/game.entity';
import { PlayerDto } from '../../player/dto/player.dto';

export enum PlaceType {
  HOME = 'HOME',
  AWAY = 'AWAY'
}

export class PlaceDto {
  type: string;
  name: string;

  static fromEntity(entity: Game): PlaceDto {
    if (!entity.hostedBy && !entity.placeOfAwayGame) {
      return null;
    }
    return {
      type: entity.hostedBy ? PlaceType.HOME : PlaceType.AWAY,
      name: entity.hostedBy ? PlayerDto.fromEntity(entity.hostedBy).name : entity.placeOfAwayGame
    }
  }
}
