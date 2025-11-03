import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Payment } from '../../model/payment.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';

export class CreatePaymentDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  gameId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  playerId: string;

  @ApiProperty({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  @IsEnum(PenaltyUnit)
  penaltyUnit: PenaltyUnit;

  @ApiProperty({ type: Number, minimum: 0 })
  @IsNumber()
  @Min(0)
  penaltyValue: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  outstandingValue: number;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  confirmed: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  confirmedBy: string;

  static mapForeignKeys(dto: CreatePaymentDto): Payment {
    return {
      ...dto,
      game: { id: dto.gameId },
      player: { id: dto.playerId },
    } as unknown as Payment;
  }
}
