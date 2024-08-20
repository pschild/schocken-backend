import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { GameEvent } from '../../model/game-event.entity';

export class CreateGameEventDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  multiplicatorValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  comment?: string;

  @IsUUID()
  gameId: string;

  @IsUUID()
  playerId: string;

  @IsUUID()
  eventTypeId: string;

  static mapForeignKeys(dto: CreateGameEventDto): GameEvent {
    return {
      ...dto,
      game: { id: dto.gameId },
      player: { id: dto.playerId },
      eventType: { id: dto.eventTypeId },
    } as unknown as GameEvent;
  }
}
