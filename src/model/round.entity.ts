import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Game } from './game.entity';
import { Player } from './player.entity';

@Entity({ name: 'round' })
export class Round extends BaseEntity {
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  datetime: Date;

  @ManyToOne(
    () => Game,
      game => game.rounds,
    {
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
}
