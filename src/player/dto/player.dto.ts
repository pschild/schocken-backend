import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameDto } from '../../game/dto/game.dto';
import { Player } from '../../model/player.entity';

export class PlayerDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  createDateTime: string;

  @ApiProperty({ type: Date })
  lastChangedDateTime: string;

  @ApiProperty({ type: Boolean })
  isDeleted: boolean;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: Date })
  registered: string;

  @ApiProperty({ type: Boolean })
  active: boolean;

  @ApiPropertyOptional({ type: String, maxLength: 64, nullable: true })
  auth0UserId?: string;

  @ApiPropertyOptional({ type: [GameDto] })
  hostedGames?: GameDto[];

  static fromEntity(entity: Player): PlayerDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      isDeleted: !!entity.deletedDateTime,
      name: entity.name,
      registered: entity.registered.toISOString(),
      active: entity.active,
      auth0UserId: entity.auth0UserId,
      ...(entity.hostedGames ? { hostedGames: GameDto.fromEntities(entity.hostedGames) } : {}),
    } : null;
  }

  static fromEntities(entities: Player[]): PlayerDto[] {
    return entities.map(e => PlayerDto.fromEntity(e));
  }
}
