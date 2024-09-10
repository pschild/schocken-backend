import { EventDto } from './event.dto';

export class CreateEventResponse {
  event: EventDto;
  warning?: string;
}
