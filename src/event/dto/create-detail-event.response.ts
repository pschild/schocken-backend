import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CelebrationDto } from '../../celebration';
import { EventDetailDto } from './event-detail.dto';

export class CreateDetailEventResponse {
  @ApiProperty({ type: EventDetailDto })
  event: EventDetailDto;

  @ApiPropertyOptional({ type: CelebrationDto })
  celebration?: CelebrationDto;

  @ApiPropertyOptional({ type: String })
  warning?: string;
}
