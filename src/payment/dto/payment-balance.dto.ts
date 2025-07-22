import { ApiProperty } from '@nestjs/swagger';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';

export class PaymentBalanceDto {
  @ApiProperty({ type: String, format: 'uuid' })
  playerId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit: PenaltyUnit;

  @ApiProperty({ type: Number })
  penaltyValue: number;

  @ApiProperty({ type: Number })
  outstandingValue: number;

}
