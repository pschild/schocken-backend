import { PlayerEntity } from '../../model/player.entity';

export class PlayerDto {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  name: string;
  registered: string;
  active: boolean;

  static fromEntity(entity: PlayerEntity): PlayerDto {
    return entity ? {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      name: entity.name,
      registered: entity.registered.toISOString(),
      active: entity.active,
    } : null;
  }

  static fromEntities(entities: PlayerEntity[]): PlayerDto[] {
    return entities.map(e => PlayerDto.fromEntity(e));
  }
}
