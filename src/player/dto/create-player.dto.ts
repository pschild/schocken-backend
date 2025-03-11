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

  @ApiPropertyOptional({ type: String, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  auth0UserId?: string;

  static mapForeignKeys(dto: CreatePlayerDto): Player {
    return {
      ...dto
    } as unknown as Player;
  }
}
