import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { EventType } from '../../model/event-type.entity';
import { CreatePenaltyDto } from '../../penalty/dto/create-penalty.dto';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class CreateEventTypeDto {
  // only for migrating from existing JSON files!
  @IsOptional()
  @IsDate()
  createDateTime?: Date;

  // only for migrating from existing JSON files!
  @IsOptional()
  @IsDate()
  lastChangedDateTime?: Date;

  @IsString()
  @MaxLength(64)
  description: string;

  @IsEnum(EventTypeContext)
  context: EventTypeContext;

  @IsOptional()
  @IsEnum(EventTypeTrigger)
  trigger?: EventTypeTrigger;

  @IsOptional()
  @Type(() => CreatePenaltyDto)
  @ValidateNested()
  penalty?: CreatePenaltyDto;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  multiplicatorUnit?: string;

  @IsOptional()
  @IsBoolean()
  hasComment?: boolean;

  @IsNumber()
  @Min(0)
  order: number;

  static mapForeignKeys(dto: CreateEventTypeDto): EventType {
    return {
      ...dto,
      ...(dto.penalty ? { penaltyValue: +dto.penalty.penaltyValue, penaltyUnit: dto.penalty.penaltyUnit } : {}),
    } as unknown as EventType;
  }
}
