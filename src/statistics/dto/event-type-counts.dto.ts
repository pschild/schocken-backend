import { ApiProperty } from '@nestjs/swagger';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';

export class EventTypeCountsDto {

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ type: Number })
  count: number;

  @ApiProperty({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit: PenaltyUnit;

  @ApiProperty({ type: Number })
  penalty: number;
}
