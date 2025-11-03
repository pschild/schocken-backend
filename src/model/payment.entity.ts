import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { BaseEntity } from './base.entity';
import { Game } from './game.entity';
import { Player } from './player.entity';

@Entity({ name: 'payment' })
export class Payment extends BaseEntity {

  @Index()
  @ManyToOne(() => Player, { nullable: false })
  player: Player;

  @Index()
  @ManyToOne(() => Game, { nullable: false, onDelete: 'CASCADE' })
  game: Game;

  @Column({ type: 'enum', enum: PenaltyUnit, nullable: true })
  penaltyUnit: PenaltyUnit;

  @Column({ type: 'real', nullable: false })
  penaltyValue: number;

  @Column({ type: 'real', nullable: false })
  outstandingValue: number;

  @Column({ default: false })
  confirmed: boolean;

  @Column({ type: 'timestamptz', default: null, nullable: true })
  confirmedAt: Date;

  @Column({ default: null, nullable: true, length: 64 })
  confirmedBy: string;
}
