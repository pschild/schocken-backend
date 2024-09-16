import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { GameCompletedException } from '../game/exception/game-completed.exception';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Round } from '../model/round.entity';
import { EventContext } from './enum/event-context.enum';

@Injectable()
@EventSubscriber()
export class EventEntitySubscriber implements EntitySubscriberInterface {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): Function | string {
    return Event;
  }

  async beforeInsert(event: InsertEvent<Event>): Promise<unknown> {
    event.entity.context === EventContext.GAME
      ? await this.checkCompletionStatusForGame(event, event.entity.game.id)
      : await this.checkCompletionStatusForRound(event, event.entity.round.id);
    return;
  }

  async beforeUpdate(event: UpdateEvent<Event>): Promise<unknown> {
    await this.checkCompletionStatusForEvent(event, event.entity.id);
    return;
  }

  async beforeRemove(event: RemoveEvent<Event>): Promise<unknown> {
    await this.checkCompletionStatusForEvent(event, event.entity.id);
    return;
  }

  private async checkCompletionStatusForGame(event: InsertEvent<Event>, gameId: string): Promise<void> {
    const game = await event.manager.getRepository(Game).findOneOrFail({ where: { id: gameId } });
    if (game.completed) {
      throw new GameCompletedException(game.id);
    }
  }

  private async checkCompletionStatusForRound(event: InsertEvent<Event>, roundId: string): Promise<void> {
    const round = await event.manager.getRepository(Round).findOneOrFail({ where: { id: roundId }, relations: ['game'] });
    if (round.game.completed) {
      throw new GameCompletedException(round.game.id);
    }
  }

  private async checkCompletionStatusForEvent(event: UpdateEvent<Event> | RemoveEvent<Event>, eventId: string): Promise<void> {
    const eventEntity = await event.manager.getRepository(Event).findOneOrFail({ where: { id: eventId }, relations: ['game', 'round', 'round.game'] });

    const completed = eventEntity.context === EventContext.GAME
      ? eventEntity.game.completed
      : eventEntity.round.game.completed;

    if (completed) {
      throw new GameCompletedException(eventEntity.game?.id || eventEntity.round.game.id);
    }
  }
}
