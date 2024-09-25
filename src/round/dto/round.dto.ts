import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventDto } from '../../event/dto/event.dto';
import { GameDto } from '../../game/dto/game.dto';
import { Round } from '../../model/round.entity';
import { PlayerDto } from '../../player/dto/player.dto';

export class RoundDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  createDateTime: string;

  @ApiProperty({ type: Date })
  lastChangedDateTime: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ type: () => GameDto })
  game: GameDto;

  @ApiPropertyOptional({ type: [PlayerDto] })
  attendees?: PlayerDto[];

  @ApiPropertyOptional({ type: [PlayerDto] })
  finalists?: PlayerDto[];

  @ApiPropertyOptional({ type: [EventDto] })
  events?: EventDto[];

  static fromEntity(entity: Round): RoundDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      game: GameDto.fromEntity(entity.game),
      ...(entity.attendees ? { attendees: PlayerDto.fromEntities(entity.attendees) } : {}),
      ...(entity.finalists ? { finalists: PlayerDto.fromEntities(entity.finalists) } : {}),
      ...(entity.events ? { events: EventDto.fromEntities(entity.events) } : {}),
    } : null;
  }

  static fromEntities(entities: Round[]): RoundDto[] {
    return entities.map(e => RoundDto.fromEntity(e));
  }
}
