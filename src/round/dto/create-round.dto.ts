import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Round } from '../../model/round.entity';

export class CreateRoundDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsUUID()
  gameId: string;

  static mapForeignKeys(dto: CreateRoundDto): Round {
    return {
      ...dto,
      game: { id: dto.gameId },
    } as unknown as Round;
  }
}
