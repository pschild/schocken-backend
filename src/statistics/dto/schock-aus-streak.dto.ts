import { ApiProperty } from '@nestjs/swagger';

export class SchockAusStreakDto {

  @ApiProperty({ type: String, format: 'uuid' })
  gameId: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ type: Number })
  streak: number;
}
