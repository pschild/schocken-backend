import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Player } from '../../model/player.entity';

export class CreatePlayerDto {
  @ApiProperty({ maxLength: 32 })
  @IsString()
  @MaxLength(32)
  name: string;

  @ApiProperty({ type: Date, required: false })
  @IsOptional()
  @IsString()
  registered?: string;

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  static mapForeignKeys(dto: CreatePlayerDto): Player {
    return {
      ...dto
    } as unknown as Player;
  }
}
