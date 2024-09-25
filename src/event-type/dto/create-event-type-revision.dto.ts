import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateIf } from 'class-validator';
import { EventTypeRevision } from '../../model/event-type-revision.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeRevisionType } from '../enum/event-type-revision-type.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class CreateEventTypeRevisionDto {
  @ApiProperty({ enum: EventTypeRevisionType, example: EventTypeRevisionType.UPDATE })
  @IsEnum(EventTypeRevisionType)
  type: EventTypeRevisionType;

  @ApiProperty({ type: String, maxLength: 64 })
  @IsString()
  @MaxLength(64)
  description: string;

  @ApiProperty({ enum: EventTypeContext, example: EventTypeContext.ROUND })
  @IsEnum(EventTypeContext)
  context: EventTypeContext;

  @ApiPropertyOptional({ enum: EventTypeTrigger, example: EventTypeTrigger.SCHOCK_AUS })
  @IsOptional()
  @IsEnum(EventTypeTrigger)
  trigger?: EventTypeTrigger;

  @ApiPropertyOptional({ type: Number })
  @ValidateIf(entity => !!entity.penaltyUnit)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  penaltyValue: number;

  @ApiPropertyOptional({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  @ValidateIf(entity => !!entity.penaltyValue)
  @IsEnum(PenaltyUnit)
  penaltyUnit: PenaltyUnit;

  @ApiPropertyOptional({ type: String, example: 'Augenzahl' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  multiplicatorUnit?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  hasComment?: boolean;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  eventTypeId: string;

  static mapForeignKeys(dto: CreateEventTypeRevisionDto): EventTypeRevision {
    return {
      ...dto,
      eventType: { id: dto.eventTypeId }
    } as unknown as EventTypeRevision;
  }
}
