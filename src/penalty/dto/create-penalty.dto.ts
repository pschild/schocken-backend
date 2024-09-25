import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { PenaltyUnit } from '../enum/penalty-unit.enum';

export class CreatePenaltyDto {
  @ApiProperty({ type: Number, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  penaltyValue: number;

  @ApiProperty({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  @IsEnum(PenaltyUnit)
  penaltyUnit: PenaltyUnit;
}
