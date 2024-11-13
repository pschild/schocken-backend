import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { EventPenaltyDto } from '../event/dto/event-penalty.dto';
import { Game } from '../model/game.entity';
import { getYear } from 'date-fns';
import { groupBy } from 'lodash';
import { PenaltyDto } from '../penalty/dto/penalty.dto';
import { summarizePenalties } from '../penalty/penalty.utils';

@Injectable()
export class GameOverviewService {

  constructor(
    @InjectRepository(Game) private readonly repo: Repository<Game>
  ) {
  }

  getOverview(): Observable<{ year: string; games: Game[]; penaltySum: PenaltyDto[] }[]> {
    return from(this.repo.find({
      /*where: { datetime: Raw(alias => `date_part('year', ${alias}) = '2023'`) },*/
      select: {
        id: true,
        datetime: true,
        hostedBy: {
          name: true,
        },
        placeOfAwayGame: true,
        placeType: true,
        completed: true,
        createDateTime: true,
        excludeFromStatistics: true,
        rounds: {
          id: true,
          events: {
            penaltyValue: true,
            penaltyUnit: true,
            multiplicatorValue: true,
          }
        },
        events: {
          penaltyValue: true,
          penaltyUnit: true,
          multiplicatorValue: true,
        }
      },
      relations: ['rounds', 'hostedBy', 'events', 'rounds.events'],
      order: { datetime: 'DESC' }
    })).pipe(
      map(games => groupBy<Game>(games, game => getYear(game.datetime))),
      map(groupedGames => Object.entries<Game[]>(groupedGames).map(([year, games]) => ({ year, games }))),
      map(items => items.sort((a, b) => +b.year - +a.year)),
      map(items => items.map(item => ({
        ...item,
        penaltySum: summarizePenalties([
          ...EventPenaltyDto.fromEntities(item.games.map(game => game.events).flat()),
          ...EventPenaltyDto.fromEntities(item.games.map(game => game.rounds.map(round => round.events).flat()).flat()),
        ])
      }))),
    );
  }

}
