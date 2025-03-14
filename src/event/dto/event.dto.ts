import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventTypeDto } from '../../event-type/dto/event-type.dto';
import { GameDto } from '../../game/dto/game.dto';
import { Event } from '../../model/event.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { PlayerDto } from '../../player/dto/player.dto';
import { RoundDto } from '../../round/dto/round.dto';
import { EventContext } from '../enum/event-context.enum';

export class EventDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  createDateTime: string;

  @ApiProperty({ type: Date })
  lastChangedDateTime: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ type: Number })
  multiplicatorValue: number;

  @ApiPropertyOptional({ type: Number })
  penaltyValue?: number;

  @ApiPropertyOptional({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit?: PenaltyUnit;

  @ApiProperty({ type: String })
  comment: string;

  @ApiProperty({ enum: EventContext, example: EventContext.ROUND })
  context: EventContext;

  @ApiPropertyOptional({ type: () => GameDto })
  game?: GameDto;

  @ApiPropertyOptional({ type: () => RoundDto })
  round?: RoundDto;

  @ApiProperty({ type: () => PlayerDto })
  player: PlayerDto;

  @ApiProperty({ type: () => EventTypeDto })
  eventType: EventTypeDto;

  static fromEntity(entity: Event): EventDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      datetime: entity.datetime.toISOString(),
      multiplicatorValue: +entity.multiplicatorValue,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
      comment: entity.comment,
      context: entity.context,
      ...(entity.game ? { game: GameDto.fromEntity(entity.game) } : {}),
      ...(entity.round ? { round: RoundDto.fromEntity(entity.round) } : {}),
      player: PlayerDto.fromEntity(entity.player),
      eventType: EventTypeDto.fromEntity(entity.eventType),
    } : null;
  }

  static fromEntities(entities: Event[]): EventDto[] {
    return entities.map(e => EventDto.fromEntity(e));
  }
}
