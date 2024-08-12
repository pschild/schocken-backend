import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateGameEventDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  multiplicatorValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  comment?: string;

  @IsUUID()
  gameId: string;

  @IsUUID()
  playerId: string;
}
