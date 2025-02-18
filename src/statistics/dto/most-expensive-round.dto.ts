import { ApiProperty } from '@nestjs/swagger';

export class MostExpensiveRoundDto {

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: Date;

  @ApiProperty({ type: Number })
  sum: number;
}
