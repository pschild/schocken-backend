import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Event } from '../../model/event.entity';
import { EventContextValidation } from '../../validators/EventContextValidation';
import { IsExclusivelyDefined } from '../../validators/IsExclusivelyDefined';
import { EventContext } from '../enum/event-context.enum';

export class CreateEventDto {
  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsString()
  datetime?: string;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  multiplicatorValue?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  comment?: string;

  @ApiProperty({ enum: EventContext, example: EventContext.ROUND })
  @IsEnum(EventContext)
  @EventContextValidation()
  context: EventContext;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  @IsExclusivelyDefined(['roundId'])
  gameId?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  @IsExclusivelyDefined(['gameId'])
  roundId?: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  playerId: string;

  @ApiProperty({ type: String, format: 'uuid' })
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
