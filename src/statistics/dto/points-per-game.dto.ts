import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PointsDto {

  @ApiProperty({ type: Number })
  rank: number;

  @ApiProperty({ type: String, format: 'uuid' })
  playerId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  roundPoints: number;

  @ApiProperty({ type: Number })
  bonusPoints: number;

  @ApiProperty({ type: Number })
  penaltyPoints: number;

  @ApiProperty({ type: Number })
  gamePoints: number;

  @ApiProperty({ type: Number })
  points: number;

  @ApiPropertyOptional({ type: Number })
  tendency?: number;
}

export class PointsPerGameDto {

  @ApiProperty({ type: String, format: 'uuid' })
  gameId: string;

  @ApiProperty({ type: String })
  datetime: string;

  @ApiProperty({ type: [PointsDto] })
  points: PointsDto[];
}
