import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameDto } from '../../game/dto/game.dto';
import { Payment } from '../../model/payment.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';
import { PlayerDetailDto } from '../../player/dto/player-detail.dto';
import { calculateDueDate } from '../payment.utils';

export class PaymentDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  createDateTime: string;

  @ApiProperty({ type: Date })
  lastChangedDateTime: string;

  @ApiProperty({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit: PenaltyUnit;

  @ApiProperty({ type: Number })
  penaltyValue: number;

  @ApiProperty({ type: Number })
  outstandingValue: number;

  @ApiProperty({ type: Boolean })
  confirmed: boolean;

  @ApiProperty({ type: Date, nullable: true })
  confirmedAt: string;

  @ApiProperty({ type: String, maxLength: 64, nullable: true })
  confirmedBy: string;

  @ApiProperty({ type: String })
  gameId: string;

  @ApiProperty({ type: String })
  playerId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: Date })
  dueDate?: string;

  static fromEntity(entity: Payment): PaymentDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      penaltyUnit: entity.penaltyUnit,
      penaltyValue: entity.penaltyValue,
      outstandingValue: entity.outstandingValue,
      confirmed: entity.confirmed,
      confirmedAt: entity.confirmedAt ? entity.confirmedAt.toISOString() : null,
      confirmedBy: entity.confirmedBy,
      gameId: GameDto.fromEntity(entity.game).id,
      playerId: PlayerDetailDto.fromEntity(entity.player).id,
      name: PlayerDetailDto.fromEntity(entity.player).name,
      dueDate: calculateDueDate(entity.confirmed, entity.outstandingValue, entity.confirmedAt),
    } : null;
  }

  static fromEntities(entities: Payment[]): PaymentDto[] {
    return entities.map(e => PaymentDto.fromEntity(e));
  }
}
