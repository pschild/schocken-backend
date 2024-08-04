import { Game } from '../../model/game.entity';
import { RoundDto } from '../../round/dto/round.dto';

export class GameDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  datetime: string;
  completed: boolean;
  rounds?: RoundDto[];

  static fromEntity(entity: Game): GameDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      completed: entity.completed,
      ...(entity.rounds ? { rounds: RoundDto.fromEntities(entity.rounds) } : {}),
    } : null;
  }

  static fromEntities(entities: Game[]): GameDto[] {
    return entities.map(e => GameDto.fromEntity(e));
  }
}
