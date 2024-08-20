import { PartialType } from '@nestjs/swagger';
import { EventType } from '../../model/event-type.entity';
import { CreateEventTypeDto } from './create-event-type.dto';

export class UpdateEventTypeDto extends PartialType(CreateEventTypeDto) {
  static mapForeignKeys(dto: UpdateEventTypeDto): EventType {
    return {
      ...dto,
    } as unknown as EventType;
  }}
