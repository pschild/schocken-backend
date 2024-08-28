import { EventDto } from '../../event/dto/event.dto';
import { GameDto } from '../../game/dto/game.dto';
import { Round } from '../../model/round.entity';
import { PlayerDto } from '../../player/dto/player.dto';

export class RoundDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  datetime: string;
  game: GameDto;
  attendees?: PlayerDto[];
  finalists?: PlayerDto[];
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
