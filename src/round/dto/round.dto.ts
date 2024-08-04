import { GameDto } from '../../game/dto/game.dto';
import { Round } from '../../model/round.entity';

export class RoundDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  datetime: string;
  game?: GameDto;
  gameId: string;

  static fromEntity(entity: Round): RoundDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      gameId: entity.gameId,
      ...(entity.game ? { game: GameDto.fromEntity(entity.game) } : {}),
    } : null;
  }

  static fromEntities(entities: Round[]): RoundDto[] {
    return entities.map(e => RoundDto.fromEntity(e));
  }
}
