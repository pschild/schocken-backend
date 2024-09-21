import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';
import { Game } from './game.entity';
import { Player } from './player.entity';

@Entity({ name: 'round' })
export class Round extends BaseEntity {
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  datetime: Date;

  @Index()
  @ManyToOne(
    () => Game,
      game => game.rounds,
    {
      nullable: false,
      onDelete: 'CASCADE' // remove orphan rounds when referring game is deleted
    }
  )
  game: Game;

  @ManyToMany(
    () => Player,
    // { eager: true } // always load attendances when loading round
  )
  @JoinTable({ name: 'attendances' })
  attendees: Player[];

  @ManyToMany(
    () => Player,
    // { eager: true } // always load finalists when loading round
  )
  @JoinTable({ name: 'finals' })
  finalists: Player[];

  @OneToMany(() => Event, event => event.round)
  events: Event[];
}
