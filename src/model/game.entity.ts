import { Check, Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { PlaceType } from '../game/enum/place-type.enum';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';
import { Player } from './player.entity';
import { Round } from './round.entity';

@Entity({ name: 'game' })
@Check('NOT ("placeOfAwayGame" IS NOT NULL AND "hostedById" is NOT NULL)')
export class Game extends BaseEntity {
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  datetime: Date;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: false })
  excludeFromStatistics: boolean;

  @Column({ type: 'enum', enum: PlaceType })
  placeType: PlaceType;

  @ManyToOne(() => Player, player => player.hostedGames, { nullable: true })
  hostedBy: Player;

  @Column({ nullable: true, length: 64 })
  placeOfAwayGame: string;

  @OneToMany(() => Round, round => round.game)
  rounds: Round[];

  @OneToMany(() => Event, event => event.game)
  events: Event[];
}
