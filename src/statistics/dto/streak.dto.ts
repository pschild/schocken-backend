import { ApiProperty } from '@nestjs/swagger';

export class StreakDto {

  @ApiProperty({ type: Number })
  rank: number;

  @ApiProperty({ type: String, format: 'uuid' })
  playerId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  maxStreak: number;

  @ApiProperty({ type: Number })
  currentStreak: number;

  @ApiProperty({ type: Boolean })
  isCurrent: boolean;

  @ApiProperty({ type: String, format: 'uuid' })
  lastRoundIdOfStreak: string;

  @ApiProperty({ type: String, format: 'uuid' })
  gameId: string;

  @ApiProperty({ type: Date })
  datetime: string;
}
