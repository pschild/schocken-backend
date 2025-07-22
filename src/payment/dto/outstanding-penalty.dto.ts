import { ApiProperty } from '@nestjs/swagger';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';

export class OutstandingPenaltyDto {
  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  outstandingValueSum: number;

  @ApiProperty({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit: PenaltyUnit;

  @ApiProperty({ type: Number })
  count: number;

  @ApiProperty({ type: Date, nullable: true })
  datetime: Date;

}
