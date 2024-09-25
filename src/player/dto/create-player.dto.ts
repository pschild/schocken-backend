import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Player } from '../../model/player.entity';

export class CreatePlayerDto {
  @ApiProperty({ maxLength: 32 })
  @IsString()
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsString()
  registered?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  static mapForeignKeys(dto: CreatePlayerDto): Player {
    return {
      ...dto
    } as unknown as Player;
  }
}
