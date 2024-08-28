import { PartialType } from '@nestjs/swagger';
import { Event } from '../../model/event.entity';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  static mapForeignKeys(dto: UpdateEventDto): Event {
    return {
      ...dto,
      ...(dto.gameId ? { game: { id: dto.gameId } } : {}),
      ...(dto.roundId ? { round: { id: dto.roundId } } : {}),
      ...(dto.playerId ? { player: { id: dto.playerId } } : {}),
      ...(dto.eventTypeId ? { eventType: { id: dto.eventTypeId } } : {}),
    } as unknown as Event;
  }
}
