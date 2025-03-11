import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Player } from '../../model/player.entity';

export class PlayerDetailDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Boolean })
  isDeleted: boolean;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Boolean })
  active: boolean;

  @ApiPropertyOptional({ type: String, maxLength: 128, nullable: true })
  auth0UserId?: string;

  static fromEntity(entity: Player): PlayerDetailDto {
    return entity ? {
      id: entity.id,
      isDeleted: !!entity.deletedDateTime,
      name: entity.name,
      active: entity.active,
      auth0UserId: entity.auth0UserId,
    } : null;
  }

  static fromEntities(entities: Player[]): PlayerDetailDto[] {
    return entities.map(e => PlayerDetailDto.fromEntity(e));
  }
}
