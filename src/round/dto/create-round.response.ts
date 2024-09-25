import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CelebrationDto } from '../../celebration';
import { RoundDto } from './round.dto';

export class CreateRoundResponse {
  @ApiProperty({ type: RoundDto })
  round: RoundDto;

  @ApiPropertyOptional({ type: CelebrationDto })
  celebration?: CelebrationDto;
}
