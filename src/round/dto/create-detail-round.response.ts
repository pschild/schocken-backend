import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CelebrationDto } from '../../celebration';
import { RoundDetailDto } from './round-detail.dto';

export class CreateDetailRoundResponse {
  @ApiProperty({ type: RoundDetailDto })
  round: RoundDetailDto;

  @ApiPropertyOptional({ type: CelebrationDto })
  celebration?: CelebrationDto;
}
