import { ApiProperty } from '@nestjs/swagger';

export class StreakDto {

  @ApiProperty({ type: Number })
  rank: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  streak: number;

  @ApiProperty({ type: Boolean })
  isCurrent: boolean;

  @ApiProperty({ type: String, format: 'uuid' })
  lastRoundIdOfStreak: string;

  @ApiProperty({ type: Date })
  datetime: string;
}
