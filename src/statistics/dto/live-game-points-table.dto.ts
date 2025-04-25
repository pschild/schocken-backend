import { ApiProperty } from '@nestjs/swagger';
import { PointsDto } from './points-per-game.dto';

export class LiveGamePointsTableDto extends PointsDto {

  @ApiProperty({ type: Number })
  rankYear: number;

  @ApiProperty({ type: Number })
  pointsYear: number;
}
