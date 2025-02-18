import { ApiProperty } from '@nestjs/swagger';
import { PointsPerGameDto } from './points-per-game.dto';

export class AccumulatedPointsPerGameDto extends PointsPerGameDto {

  @ApiProperty({ type: Number })
  tendency: number;
}
