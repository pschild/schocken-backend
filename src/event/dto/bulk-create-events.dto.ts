import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EventContextValidation } from '../../validators/EventContextValidation';
import { IsExclusivelyDefined } from '../../validators/IsExclusivelyDefined';
import { EventContext } from '../enum/event-context.enum';

export class BulkCreateEventsDto {
  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsString()
  datetime?: string;

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

  @ApiProperty({ type: String, format: 'uuid', isArray: true })
  @IsArray()
  @IsUUID('all', { each: true })
  playerIds: string[];

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  eventTypeId: string;
}
