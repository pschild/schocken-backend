import { ApiProperty } from '@nestjs/swagger';

export class SchockAusEffectivityTableDto {

  @ApiProperty({ type: Number })
  rank: number;

  @ApiProperty({ type: String, format: 'uuid' })
  playerId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  saCount: number;

  @ApiProperty({ type: Number })
  sasCount: number;

  @ApiProperty({ type: Number })
  quote: number;
}
