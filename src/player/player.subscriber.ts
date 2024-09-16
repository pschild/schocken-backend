import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { Player } from '../model/player.entity';
import { DuplicatePlayerNameException } from './exception/duplicate-player-name.exception';

@Injectable()
@EventSubscriber()
export class PlayerSubscriber implements EntitySubscriberInterface {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): Function | string {
    return Player;
  }

  async beforeInsert(event: InsertEvent<Player>): Promise<unknown> {
    await this.checkDuplicateName(event, event.entity.name);
    return;
  }

  async beforeUpdate(event: UpdateEvent<Player>): Promise<unknown> {
    await this.checkDuplicateName(event, event.entity.name);
    return;
  }

  private async checkDuplicateName(event: InsertEvent<Player> | UpdateEvent<Player>, name: string): Promise<void> {
    const entityWithName = await event.manager.getRepository(Player).findOneBy({ name });
    if (entityWithName && entityWithName.id !== event.entity.id) {
      throw new DuplicatePlayerNameException();
    }
  }
}
