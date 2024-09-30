import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PenaltyUnit } from '../enum/penalty-unit.enum';

export class CreatePenaltyDto {
  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  penaltyValue: number;

  @ApiPropertyOptional({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  @IsEnum(PenaltyUnit)
  @IsOptional()
  penaltyUnit: PenaltyUnit;
}
