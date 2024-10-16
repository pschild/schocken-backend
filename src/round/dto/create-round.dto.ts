import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { Round } from '../../model/round.entity';

export class CreateRoundDto {
  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsString()
  datetime?: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  gameId: string;

  @ApiPropertyOptional({ type: String, format: 'uuid', isArray: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  attendees?: string[];

  static mapForeignKeys(dto: CreateRoundDto): Round {
    return {
      ...dto,
      game: { id: dto.gameId },
      attendees: dto.attendees.map(id => ({ id })),
    } as unknown as Round;
  }
}
