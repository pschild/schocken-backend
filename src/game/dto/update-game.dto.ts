import { PartialType } from '@nestjs/swagger';
import { Game } from '../../model/game.entity';
import { CreateGameDto } from './create-game.dto';

export class UpdateGameDto extends PartialType(CreateGameDto) {
  static mapForeignKeys(dto: UpdateGameDto): Game {
    return {
      ...dto,
      ...(dto.hostedById ? { hostedBy: { id: dto.hostedById } } : {}),
    } as unknown as Game;
  }
}
