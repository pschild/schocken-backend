import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateIf } from 'class-validator';
import { EventTypeRevision } from '../../model/event-type-revision.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeRevisionType } from '../enum/event-type-revision-type.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class CreateEventTypeRevisionDto {
  @IsEnum(EventTypeRevisionType)
  type: EventTypeRevisionType;

  @IsString()
  @MaxLength(64)
  description: string;

  @IsEnum(EventTypeContext)
  context: EventTypeContext;

  @IsOptional()
  @IsEnum(EventTypeTrigger)
  trigger?: EventTypeTrigger;

  @ValidateIf(entity => !!entity.penaltyUnit)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  penaltyValue: number;

  @ValidateIf(entity => !!entity.penaltyValue)
  @IsEnum(PenaltyUnit)
  penaltyUnit: PenaltyUnit;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  multiplicatorUnit?: string;

  @IsOptional()
  @IsBoolean()
  hasComment?: boolean;

  @IsUUID()
  eventTypeId: string;

  static mapForeignKeys(dto: CreateEventTypeRevisionDto): EventTypeRevision {
    return {
      ...dto,
      eventType: { id: dto.eventTypeId }
    } as unknown as EventTypeRevision;
  }
}
