import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Round } from './round.entity';

@Entity({ name: 'game' })
export class Game extends BaseEntity {
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  datetime: Date;

  @Column({ default: false })
  completed: boolean;

  @OneToMany(() => Round, round => round.game)
  rounds: Round[];
}
