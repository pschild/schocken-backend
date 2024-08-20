import { PartialType } from '@nestjs/swagger';
import { Player } from '../../model/player.entity';
import { CreatePlayerDto } from './create-player.dto';

export class UpdatePlayerDto extends PartialType(CreatePlayerDto) {
  static mapForeignKeys(dto: UpdatePlayerDto): Player {
    return {
      ...dto
    } as unknown as Player;
  }
}
