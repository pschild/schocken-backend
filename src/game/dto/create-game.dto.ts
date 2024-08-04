import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
