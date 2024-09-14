import { CelebrationDto } from '../../celebration';
import { EventDto } from './event.dto';

export class CreateEventResponse {
  event: EventDto;
  celebration?: CelebrationDto;
  warning?: string;
}
