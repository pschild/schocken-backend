import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { GameEvent } from '../../model/game-event.entity';

export class CreateGameEventDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  multiplicatorValue?: number;

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
