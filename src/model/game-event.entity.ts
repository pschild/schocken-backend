import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EventType } from './event-type.entity';
import { Game } from './game.entity';
import { Player } from './player.entity';

@Entity({ name: 'game_event' })
export class GameEvent extends BaseEntity {
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  datetime: Date;

  @Column({ type: 'numeric', nullable: false, default: 1 })
  multiplicatorValue: number;

  @Column({ nullable: true, length: 128 })
  comment: string;

  @ManyToOne(
    () => Game,
    game => game.events,
    {
      nullable: false,
      onDelete: 'CASCADE' // remove orphan events when referring game is deleted
    }
  )
  game: Game;

  @ManyToOne(() => Player, { nullable: false })
  player: Player;

  @ManyToOne(() => EventType, { nullable: false })
  eventType: EventType;
}
