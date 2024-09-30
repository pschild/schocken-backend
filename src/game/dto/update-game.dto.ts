import { PartialType } from '@nestjs/swagger';
import { Game } from '../../model/game.entity';
import { CreateGameDto } from './create-game.dto';

export class UpdateGameDto extends PartialType(CreateGameDto) {
  static mapForeignKeys(dto: UpdateGameDto): Game {
    return {
      ...dto,
      ...(dto.hasOwnProperty('hostedById') ? { hostedBy: dto.hostedById ? { id: dto.hostedById } : null } : {}),
    } as unknown as Game;
  }
}
