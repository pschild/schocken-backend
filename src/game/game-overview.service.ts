import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { Game } from '../model/game.entity';

@Injectable()
export class GameOverviewService {

  constructor(
    @InjectRepository(Game) private readonly repo: Repository<Game>
  ) {
  }

  getOverview(): Observable<Game[]> {
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
    }));
  }

}
