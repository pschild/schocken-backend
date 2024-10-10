import { ApiProperty } from '@nestjs/swagger';
import { EventDetailDto } from '../../event/dto/event-detail.dto';
import { Game } from '../../model/game.entity';
import { RoundDetailDto } from '../../round/dto/round-detail.dto';
import { GameDto } from './game.dto';
import { PlaceDto } from './place.dto';

export class GameDetailFullDto {
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

  @ApiProperty({ type: [RoundDetailDto] })
  rounds: RoundDetailDto[];

  @ApiProperty({ type: [EventDetailDto] })
  events: EventDetailDto[];

  static fromEntity(entity: Game): GameDetailFullDto {
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

  static fromEntities(entities: Game[]): GameDetailFullDto[] {
    return entities.map(e => GameDetailFullDto.fromEntity(e));
  }
}
