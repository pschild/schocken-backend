import { Player } from '../../model/player.entity';

export class PlayerDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  name: string;
  registered: string;
  active: boolean;

  static fromEntity(entity: Player): PlayerDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      name: entity.name,
      registered: entity.registered.toISOString(),
      active: entity.active,
    } : null;
  }

  static fromEntities(entities: Player[]): PlayerDto[] {
    return entities.map(e => PlayerDto.fromEntity(e));
  }
}
