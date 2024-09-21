import { ApiProperty } from '@nestjs/swagger';

export class PenaltyDto {
  @ApiProperty({ type: String })
  unit: string;

  @ApiProperty({ type: Number })
  sum: number;
}
