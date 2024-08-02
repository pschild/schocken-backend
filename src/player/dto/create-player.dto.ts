import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  registered: string;

  @IsOptional()
  @IsBoolean()
  active: boolean;
}
