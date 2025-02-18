import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { PlaceType } from '../../game/enum/place-type.enum';
import { Game } from '../../model/game.entity';
import { HostsTableDto } from '../dto';
import { PlayerStatisticsService } from '../player/player-statistics.service';
import { addRanking, findPropertyById } from '../statistics.utils';

@Injectable()
export class HostingStatisticsService {

  constructor(
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    private playerStatisticsService: PlayerStatisticsService,
  ) {
  }

  async hostsTable(gameIds: string[], onlyActivePlayers: boolean): Promise<HostsTableDto[]> {
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);

    const result = await this.gameRepo
      .createQueryBuilder()
      .select(['count(*)', '"hostedById"', '"placeType"'])
      .where({ id: In(gameIds) })
      .andWhere([ { hostedBy: { id: In(playerIds) } }, { placeType: Not(PlaceType.HOME) } ])
      .groupBy('"hostedById"')
      .addGroupBy('"placeType"')
      .getRawMany();

    return addRanking(
      result.map(entry => ({
        ...entry,
        ...(entry.placeType === PlaceType.HOME ? { name: findPropertyById(players, entry.hostedById, 'name') } : {}),
        count: +entry.count,
      })),
      ['count'],
      ['desc']
    );
  }

}
