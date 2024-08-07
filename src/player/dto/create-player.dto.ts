import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
