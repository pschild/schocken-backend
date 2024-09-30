import { PartialType } from '@nestjs/swagger';
import { EventType } from '../../model/event-type.entity';
import { CreateEventTypeDto } from './create-event-type.dto';

export class UpdateEventTypeDto extends PartialType(CreateEventTypeDto) {
  static mapForeignKeys(dto: UpdateEventTypeDto): EventType {
    return {
      ...dto,
      ...(dto.hasOwnProperty('penalty') ? { penaltyValue: dto.penalty ? dto.penalty.penaltyValue : null, penaltyUnit: dto.penalty ? dto.penalty.penaltyUnit: null } : {}),
    } as unknown as EventType;
  }}
