import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Player } from '../../model/player.entity';

export class CreatePlayerDto {
  @IsString()
  @MaxLength(32)
  name: string;

  @IsOptional()
  @IsString()
  registered?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  static mapForeignKeys(dto: CreatePlayerDto): Player {
    return {
      ...dto
    } as unknown as Player;
  }
}
