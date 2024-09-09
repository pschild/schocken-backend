import { Player } from '../../model/player.entity';

export class PlayerDetailDto {
  id: string;
  isDeleted: boolean;
  name: string;
  active: boolean;

  static fromEntity(entity: Player): PlayerDetailDto {
    return entity ? {
      id: entity.id,
      isDeleted: !!entity.deletedDateTime,
      name: entity.name,
      active: entity.active,
    } : null;
  }

  static fromEntities(entities: Player[]): PlayerDetailDto[] {
    return entities.map(e => PlayerDetailDto.fromEntity(e));
  }
}
