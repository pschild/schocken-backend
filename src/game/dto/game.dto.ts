import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventDto } from '../../event/dto/event.dto';
import { Game } from '../../model/game.entity';
import { RoundDto } from '../../round/dto/round.dto';
import { PlaceType } from '../enum/place-type.enum';
import { PlaceDto } from './place.dto';

export class GameDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  createDateTime: string;

  @ApiProperty({ type: Date })
  lastChangedDateTime: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ type: Boolean })
  completed: boolean;

  @ApiProperty({ type: Boolean })
  excludeFromStatistics: boolean;

  @ApiPropertyOptional({ type: PlaceDto })
  place?: PlaceDto;

  @ApiPropertyOptional({ type: [RoundDto] })
  rounds?: RoundDto[];

  @ApiPropertyOptional({ type: [EventDto] })
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
      hostedById: entity.hostedBy?.id,
      locationLabel: GameDto.mapLocation(entity)
    }
  }

  private static mapLocation(entity: Game): string {
    switch (entity.placeType) {
      case PlaceType.HOME:
        return entity.hostedBy?.name;
      case PlaceType.AWAY:
        return entity.placeOfAwayGame;
      case PlaceType.REMOTE:
        return null;
    }
  }
}
