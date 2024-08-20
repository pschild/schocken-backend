import { PartialType } from '@nestjs/swagger';
import { GameEvent } from '../../model/game-event.entity';
import { CreateGameEventDto } from './create-game-event.dto';

export class UpdateGameEventDto extends PartialType(CreateGameEventDto) {
  static mapForeignKeys(dto: UpdateGameEventDto): GameEvent {
    return {
      ...dto,
      ...(dto.gameId ? { game: { id: dto.gameId } } : {}),
      ...(dto.playerId ? { player: { id: dto.playerId } } : {}),
      ...(dto.eventTypeId ? { eventType: { id: dto.eventTypeId } } : {}),
    } as unknown as GameEvent;
  }
}
