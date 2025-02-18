import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cached } from '../../decorator/cached.decorator';
import { Player } from '../../model/player.entity';

@Injectable()
export class PlayerStatisticsService {

  constructor(
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>
  ) {
  }

  @Cached()
  async players(onlyActive: boolean): Promise<{ id: string; name: string }[]> {
    return this.playerRepo.find({ select: ['id', 'name'], where: { ...(onlyActive ? { active: true } : {}), }, withDeleted: !onlyActive });
  }

  @Cached()
  async playerIds(onlyActive: boolean): Promise<string[]> {
    return (await this.players(onlyActive)).map(({ id }) => id);
  }

}
