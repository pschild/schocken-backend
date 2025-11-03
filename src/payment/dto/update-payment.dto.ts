import { PartialType } from '@nestjs/swagger';
import { Payment } from '../../model/payment.entity';
import { CreatePaymentDto } from './create-payment.dto';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  static mapForeignKeys(dto: UpdatePaymentDto): Payment {
    return {
      ...dto,
      game: { id: dto.gameId },
      player: { id: dto.playerId },
    } as unknown as Payment;
  }
}
