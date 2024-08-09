import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsExclusivelyDefined } from '../../validators/IsExclusivelyDefined';

export class CreateGameDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsUUID()
  @IsExclusivelyDefined(['placeOfAwayGame'])
  hostedById?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsExclusivelyDefined(['hostedById'])
  placeOfAwayGame?: string;
}
