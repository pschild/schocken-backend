import { EventDto } from '../../event/dto/event.dto';
import { Game } from '../../model/game.entity';
import { summarizePenalties } from '../../penalty/penalty.utils';
import { PlaceType } from '../enum/place-type.enum';
import { GameDto } from './game.dto';

export class GameOverviewDto {
  id: string;
  datetime: string;
  completed: boolean;
  excludeFromStatistics: boolean;
  place?: { type: PlaceType; location?: string };
  roundCount: number;
  penalties: { unit: string, sum: number }[];

  static fromEntity(entity: Game): GameOverviewDto {
    return entity ? {
      id: entity.id,
      datetime: entity.datetime.toISOString(),
      completed: entity.completed,
      excludeFromStatistics: entity.excludeFromStatistics,
      place: GameDto.mapPlace(entity),
      roundCount: entity.rounds.length,
      penalties: summarizePenalties([
        ...GameOverviewDto.getGameEvents(entity),
        ...GameOverviewDto.getRoundEvents(entity),
      ]),
    } : null;
  }

  static fromEntities(entities: Game[]): GameOverviewDto[] {
    return entities.map(e => GameOverviewDto.fromEntity(e));
  }

  private static getGameEvents(game: Game): EventDto[] {
    return EventDto.fromEntities(game.events);
  }

  private static getRoundEvents(game: Game): EventDto[] {
    return (game.rounds || []).map(round => EventDto.fromEntities(round.events || [])).flat();
  }
}
