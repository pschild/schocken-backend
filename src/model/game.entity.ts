import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Player } from './player.entity';
import { Round } from './round.entity';

@Entity({ name: 'game' })
export class Game extends BaseEntity {
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  datetime: Date;

  @Column({ default: false })
  completed: boolean;

  @ManyToOne(() => Player, player => player.hostedGames, { nullable: true, onDelete: 'SET NULL' })
  hostedBy: Player;

  @Column({ nullable: true, length: 64 })
  placeOfAwayGame: string;

  @OneToMany(() => Round, round => round.game)
  rounds: Round[];
}
