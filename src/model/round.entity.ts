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

  @Column()
  gameId: string; // @ManyToOne also creates this column, but we need it explicitly to create a new round and passing only an existing game's id here. (https://github.com/typeorm/typeorm/issues/447#issuecomment-298896602)

  @ManyToMany(
    () => Player,
    // { eager: true } // always load attendances when loading round
  )
  @JoinTable({ name: 'attendances' })
  attendees: Player[];
}
