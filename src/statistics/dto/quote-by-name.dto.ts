import { ApiProperty } from '@nestjs/swagger';

export class QuoteByNameDto {

  @ApiProperty({ type: Number })
  rank: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  count: number;

  @ApiProperty({ type: Number })
  quote: number;
}
