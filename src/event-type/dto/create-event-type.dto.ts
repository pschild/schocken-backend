import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventType } from '../../model/event-type.entity';
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

  @IsOptional()
  @IsString()
  @MaxLength(32)
  multiplicatorUnit?: string;

  @IsOptional()
  @IsBoolean()
  hasComment?: boolean;

  @IsNumber()
  order: number;

  static mapForeignKeys(dto: CreateEventTypeDto): EventType {
    return {
      ...dto,
    } as unknown as EventType;
  }
}
