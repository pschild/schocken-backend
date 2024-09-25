import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Round } from '../../model/round.entity';

export class CreateRoundDto {
  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsString()
  datetime?: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  gameId: string;

  static mapForeignKeys(dto: CreateRoundDto): Round {
    return {
      ...dto,
      game: { id: dto.gameId },
    } as unknown as Round;
  }
}
