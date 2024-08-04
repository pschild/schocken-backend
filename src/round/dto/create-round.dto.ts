import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoundDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsUUID()
  gameId: string;
}
