import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Game } from '../../model/game.entity';
import { IsExclusivelyDefined } from '../../validators/IsExclusivelyDefined';
import { PlaceValidation } from '../../validators/PlaceValidation';
import { PlaceType } from '../enum/place-type.enum';

export class CreateGameDto {
  @IsOptional()
  @IsString()
  datetime?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsEnum(PlaceType)
  @PlaceValidation()
  placeType: PlaceType;

  @IsOptional()
  @IsUUID()
  @IsExclusivelyDefined(['placeOfAwayGame'])
  hostedById?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsExclusivelyDefined(['hostedById'])
  placeOfAwayGame?: string;

  static mapForeignKeys(dto: CreateGameDto): Game {
    return {
      ...dto,
      hostedBy: { id: dto.hostedById }
    } as unknown as Game;
  }
}
