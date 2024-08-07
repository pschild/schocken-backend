import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsUUID()
  hostedById?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  placeOfAwayGame?: string;
}
