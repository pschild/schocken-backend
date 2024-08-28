import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Event } from '../../model/event.entity';
import { EventContextValidation } from '../../validators/EventContextValidation';
import { IsExclusivelyDefined } from '../../validators/IsExclusivelyDefined';
import { EventContext } from '../enum/event-context.enum';

export class CreateEventDto {
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

  @IsEnum(EventContext)
  @EventContextValidation()
  context: EventContext;

  @IsOptional()
  @IsUUID()
  @IsExclusivelyDefined(['roundId'])
  gameId?: string;

  @IsOptional()
  @IsUUID()
  @IsExclusivelyDefined(['gameId'])
  roundId?: string;

  @IsUUID()
  playerId: string;

  @IsUUID()
  eventTypeId: string;

  static mapForeignKeys(dto: CreateEventDto): Event {
    return {
      ...dto,
      ...(dto.gameId ? { game: { id: dto.gameId } } : {}),
      ...(dto.roundId ? { round: { id: dto.roundId } } : {}),
      player: { id: dto.playerId },
      eventType: { id: dto.eventTypeId },
    } as unknown as Event;
  }
}
