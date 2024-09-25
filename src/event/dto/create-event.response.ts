import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CelebrationDto } from '../../celebration';
import { EventDto } from './event.dto';

export class CreateEventResponse {
  @ApiProperty({ type: EventDto })
  event: EventDto;

  @ApiPropertyOptional({ type: CelebrationDto })
  celebration?: CelebrationDto;

  @ApiPropertyOptional({ type: String })
  warning?: string;
}
