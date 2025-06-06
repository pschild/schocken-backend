import { Check, Column, Entity, Index, ManyToOne } from 'typeorm';
import { EventContext } from '../event/enum/event-context.enum';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { BaseEntity } from './base.entity';
import { EventType } from './event-type.entity';
import { Game } from './game.entity';
import { Player } from './player.entity';
import { Round } from './round.entity';

@Entity({ name: 'event' })
@Check('NOT ("gameId" IS NOT NULL AND "roundId" is NOT NULL)')
@Check('("context" = \'GAME\' AND "gameId" IS NOT NULL) OR ("context" = \'ROUND\' AND "roundId" IS NOT NULL)')
export class Event extends BaseEntity {
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  datetime: Date;

  @Column({ type: 'real', nullable: false, default: 1 })
  multiplicatorValue: number;

  @Column({ type: 'real', nullable: true })
  penaltyValue: number;

  @Column({ type: 'enum', enum: PenaltyUnit, nullable: true })
  penaltyUnit: PenaltyUnit;

  @Column({ nullable: true, length: 128 })
  comment: string;

  @Column({ type: 'enum', enum: EventContext })
  context: EventContext;

  @Index()
  @ManyToOne(
    () => Game,
    game => game.events,
    {
      nullable: true,
      onDelete: 'CASCADE' // remove orphan events when referring game is deleted
    }
  )
  game: Game;

  @Index()
  @ManyToOne(
    () => Round,
    round => round.events,
    {
      nullable: true,
      onDelete: 'CASCADE' // remove orphan events when referring round is deleted
    }
  )
  round: Round;

  @Index()
  @ManyToOne(() => Player, { nullable: false })
  player: Player;

  @Index()
  @ManyToOne(() => EventType, { nullable: false })
  eventType: EventType;
}
