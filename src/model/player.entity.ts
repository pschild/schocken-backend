import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Game } from './game.entity';

@Entity({ name: 'player' })
export class Player extends BaseEntity {
  @Column({ unique: true, length: 32 })
  name: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', update: false })
  registered: Date;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true, length: 64 })
  auth0UserId: string;

  @OneToMany(() => Game, game => game.hostedBy)
  hostedGames: Game[];
}
