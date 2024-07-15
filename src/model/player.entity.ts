import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'player' })
export class PlayerEntity extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  registered: Date;

  @Column({ default: true })
  active: boolean;
}
