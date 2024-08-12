import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventTypeContext } from '../enum/event-type-context.enum';
import { EventTypeTrigger } from '../enum/event-type-trigger.enum';

export class CreateEventTypeDto {
  @IsString()
  @MaxLength(64)
  description: string;

  @IsEnum(EventTypeContext)
  context: EventTypeContext;

  @IsOptional()
  @IsEnum(EventTypeTrigger)
  trigger?: EventTypeTrigger;

  // TODO: penalty
  // TODO: history

  @IsOptional()
  @IsString()
  @MaxLength(32)
  multiplicatorUnit?: string;

  @IsOptional()
  @IsBoolean()
  hasComment?: boolean;

  @IsNumber()
  order: number;
}
