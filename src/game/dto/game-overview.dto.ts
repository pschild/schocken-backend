import { ApiProperty } from '@nestjs/swagger';
import { EventPenaltyDto } from '../../event/dto/event-penalty.dto';
import { Game } from '../../model/game.entity';
import { PenaltyDto } from '../../penalty/dto/penalty.dto';
import { summarizePenalties } from '../../penalty/penalty.utils';
import { GameDto } from './game.dto';
import { PlaceDto } from './place.dto';

export class GameOverviewDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ type: Boolean })
  completed: boolean;

  @ApiProperty({ type: Boolean })
  excludeFromStatistics: boolean;

  @ApiProperty({ type: PlaceDto })
  place: PlaceDto;

  @ApiProperty({ type: Number })
  roundCount: number;

  @ApiProperty({ type: [PenaltyDto] })
  penalties: PenaltyDto[];

  static fromEntity(entity: Game): GameOverviewDto {
    return entity ? {
      id: entity.id,
      datetime: entity.datetime.toISOString(),
      completed: entity.completed,
      excludeFromStatistics: entity.excludeFromStatistics,
      place: GameDto.mapPlace(entity),
      roundCount: entity.rounds.length,
      penalties: summarizePenalties([
        ...EventPenaltyDto.fromEntities(entity.events),
        ...(entity.rounds || []).map(round => EventPenaltyDto.fromEntities(round.events || [])).flat(),
      ]),
    } : null;
  }

  static fromEntities(entities: Game[]): GameOverviewDto[] {
    return entities.map(e => GameOverviewDto.fromEntity(e));
  }
}
