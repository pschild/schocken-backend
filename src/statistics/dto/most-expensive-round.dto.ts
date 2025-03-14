import { ApiProperty } from '@nestjs/swagger';

export class MostExpensiveRoundDto {

  @ApiProperty({ type: String, format: 'uuid' })
  gameId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  roundId: string;

  @ApiProperty({ type: Date })
  datetime: Date;

  @ApiProperty({ type: Number })
  sum: number;
}
