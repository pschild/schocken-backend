import { EventDto } from './event.dto';

export class EventWithWarningDto {
  entity: EventDto;
  warning?: string;
}
