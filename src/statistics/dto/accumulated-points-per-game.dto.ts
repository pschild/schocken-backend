import { ApiProperty } from '@nestjs/swagger';
import { PointsDto } from './points-per-game.dto';

export class AccumulatedPointsPerGameDto {

  @ApiProperty({ type: String, format: 'uuid' })
  gameId: string;

  @ApiProperty({ type: String })
  datetime: string;

  @ApiProperty({ type: [PointsDto] })
  points: PointsDto[];
}
