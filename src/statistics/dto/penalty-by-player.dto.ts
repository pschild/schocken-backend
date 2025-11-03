import { ApiProperty } from '@nestjs/swagger';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';

export class PenaltyByPlayerDto {

  @ApiProperty({ type: String, format: 'uuid' })
  playerId: string;

  @ApiProperty({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit: PenaltyUnit;

  @ApiProperty({ type: Number })
  penalty: number;
}
