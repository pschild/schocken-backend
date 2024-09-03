import { IsEnum, IsNumber, Min } from 'class-validator';
import { PenaltyUnit } from '../enum/penalty-unit.enum';

export class CreatePenaltyDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  penaltyValue: number;

  @IsEnum(PenaltyUnit)
  penaltyUnit: PenaltyUnit;
}
