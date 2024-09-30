import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Game } from '../../model/game.entity';
import { IsExclusivelyDefined } from '../../validators/IsExclusivelyDefined';
import { PlaceValidation } from '../../validators/PlaceValidation';
import { PlaceType } from '../enum/place-type.enum';

export class CreateGameDto {
  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsString()
  datetime?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  excludeFromStatistics?: boolean;

  @ApiProperty({ enum: PlaceType, example: PlaceType.HOME })
  @IsEnum(PlaceType)
  @PlaceValidation()
  placeType: PlaceType;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  @IsExclusivelyDefined(['placeOfAwayGame'])
  hostedById?: string;

  @ApiPropertyOptional({ type: String, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsExclusivelyDefined(['hostedById'])
  placeOfAwayGame?: string;

  static mapForeignKeys(dto: CreateGameDto): Game {
    return {
      ...dto,
      ...(dto.hasOwnProperty('hostedById') ? { hostedBy: dto.hostedById ? { id: dto.hostedById } : null } : {}),
    } as unknown as Game;
  }
}
