import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { GameCompletedException } from '../game/exception/game-completed.exception';
import { Game } from '../model/game.entity';
import { Round } from '../model/round.entity';

@Injectable()
@EventSubscriber()
export class RoundSubscriber implements EntitySubscriberInterface {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): Function | string {
    return Round;
  }

  async beforeInsert(event: InsertEvent<Round>): Promise<unknown> {
    await this.checkCompletionStatusForGame(event, event.entity.game.id);
    return;
  }

  async beforeUpdate(event: UpdateEvent<Round>): Promise<unknown> {
    await this.checkCompletionStatusForRound(event, event.entity.id);
    return;
  }

  async beforeRemove(event: RemoveEvent<Round>): Promise<unknown> {
    await this.checkCompletionStatusForRound(event, event.entity.id);
    return;
  }

  private async checkCompletionStatusForGame(event: InsertEvent<Round>, gameId: string): Promise<void> {
    const game = await event.manager.getRepository(Game).findOneOrFail({ where: { id: gameId } });
    if (game.completed) {
      throw new GameCompletedException(game.id);
    }
  }

  private async checkCompletionStatusForRound(event: UpdateEvent<Round> | RemoveEvent<Round>, roundId: string): Promise<void> {
    const round = await event.manager.getRepository(Round).findOneOrFail({ where: { id: roundId }, relations: ['game'] });
    if (round.game.completed) {
      throw new GameCompletedException(round.game.id);
    }
  }
}
