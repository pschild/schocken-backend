import { PartialType } from '@nestjs/swagger';
import { EventType } from '../../model/event-type.entity';
import { CreateEventTypeDto } from './create-event-type.dto';

export class UpdateEventTypeDto extends PartialType(CreateEventTypeDto) {
  static mapForeignKeys(dto: UpdateEventTypeDto): EventType {
    return {
      ...dto,
      ...(dto.penalty ? { penaltyValue: dto.penalty.penaltyValue, penaltyUnit: dto.penalty.penaltyUnit } : {}),
    } as unknown as EventType;
  }}
