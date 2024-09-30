import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { EventType } from '../../model/event-type.entity';
import { CreatePenaltyDto } from '../../penalty/dto/create-penalty.dto';
import { PenaltyValidation } from '../../validators/PenaltyValidation';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class CreateEventTypeDto {
  // only for migrating from existing JSON files!
  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  createDateTime?: Date;

  // only for migrating from existing JSON files!
  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  lastChangedDateTime?: Date;

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

  @ApiPropertyOptional({ type: CreatePenaltyDto })
  @IsOptional()
  @Type(() => CreatePenaltyDto)
  @ValidateNested()
  @PenaltyValidation()
  penalty?: CreatePenaltyDto;

  @ApiPropertyOptional({ type: String, maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  multiplicatorUnit?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  hasComment?: boolean;

  static mapForeignKeys(dto: CreateEventTypeDto): EventType {
    return {
      ...dto,
      ...(dto.penalty ? { penaltyValue: +dto.penalty.penaltyValue, penaltyUnit: dto.penalty.penaltyUnit } : {}),
    } as unknown as EventType;
  }
}
