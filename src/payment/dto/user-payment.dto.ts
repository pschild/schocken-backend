import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';

export class UserPaymentDto {
  @ApiProperty({ type: String, format: 'uuid' })
  gameId: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit: PenaltyUnit;

  @ApiProperty({ type: Number })
  penaltyValue: number;

  @ApiProperty({ type: Number })
  outstandingValue: number;

  @ApiProperty({ type: Date })
  lastChangedDateTime: string;

  @ApiProperty({ type: Boolean })
  confirmed: boolean;

  @ApiProperty({ type: Date, nullable: true })
  confirmedAt: string;

  @ApiProperty({ type: String, nullable: true })
  confirmedBy: string;

  @ApiPropertyOptional({ type: Date })
  dueDate?: string;

}
