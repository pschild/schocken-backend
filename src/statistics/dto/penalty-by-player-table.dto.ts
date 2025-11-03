import { ApiProperty } from '@nestjs/swagger';

export class PenaltyByPlayerTableDto {

  @ApiProperty({ type: Number })
  rank: number;

  @ApiProperty({ type: String, format: 'uuid' })
  playerId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  gameEventEuroSum: number;

  @ApiProperty({ type: Number })
  roundEventEuroSum: number;

  @ApiProperty({ type: Number })
  euroSum: number;

  @ApiProperty({ type: Number })
  quote: number;

  @ApiProperty({ type: Number })
  euroPerRound: number;

  @ApiProperty({ type: Boolean })
  attended: boolean;
}
