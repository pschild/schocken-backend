import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePlayerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  active: boolean;
}
