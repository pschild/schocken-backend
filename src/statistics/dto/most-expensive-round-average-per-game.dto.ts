import { ApiProperty } from '@nestjs/swagger';

export class MostExpensiveRoundAveragePerGameDto {

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: Date;

  @ApiProperty({ type: Number })
  roundAverage: number;
}
