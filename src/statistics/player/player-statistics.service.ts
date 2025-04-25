import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { MemoizeWithCacheManager } from '../../decorator/cached.decorator';
import { Player } from '../../model/player.entity';

@Injectable()
export class PlayerStatisticsService {

  constructor(
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
  }

  @MemoizeWithCacheManager()
  async players(onlyActive: boolean): Promise<{ id: string; name: string }[]> {
    return this.playerRepo.find({ select: ['id', 'name'], where: { ...(onlyActive ? { active: true } : {}), }, withDeleted: !onlyActive });
  }

  @MemoizeWithCacheManager()
  async playerIds(onlyActive: boolean): Promise<string[]> {
    return (await this.players(onlyActive)).map(({ id }) => id);
  }

}
