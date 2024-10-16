import { ApiProperty } from '@nestjs/swagger';
import { EventDetailDto } from '../../event/dto/event-detail.dto';
import { EventPenaltyDto } from '../../event/dto/event-penalty.dto';
import { Game } from '../../model/game.entity';
import { PenaltyDto } from '../../penalty/dto/penalty.dto';
import { summarizePenalties } from '../../penalty/penalty.utils';
import { GameDto } from './game.dto';
import { PlaceDto } from './place.dto';

export class GameDetailDto {
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

  @ApiProperty({ type: [EventDetailDto] })
  events: EventDetailDto[];

  @ApiProperty({ type: [PenaltyDto] })
  penalties: PenaltyDto[];

  static fromEntity(entity: Game): GameDetailDto {
    return entity ? {
      id: entity.id,
      datetime: entity.datetime.toISOString(),
      completed: entity.completed,
      excludeFromStatistics: entity.excludeFromStatistics,
      place: GameDto.mapPlace(entity),
      events: EventDetailDto.fromEntities(entity.events),
      penalties: summarizePenalties(EventPenaltyDto.fromEntities(entity.events)),
    } : null;
  }

  static fromEntities(entities: Game[]): GameDetailDto[] {
    return entities.map(e => GameDetailDto.fromEntity(e));
  }
}
