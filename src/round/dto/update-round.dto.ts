import { PartialType } from '@nestjs/swagger';
import { Round } from '../../model/round.entity';
import { CreateRoundDto } from './create-round.dto';

export class UpdateRoundDto extends PartialType(CreateRoundDto) {
  static mapForeignKeys(dto: UpdateRoundDto): Round {
    return {
      ...dto,
      ...(dto.gameId ? { game: { id: dto.gameId } } : {}),
    } as unknown as Round;
  }
}
