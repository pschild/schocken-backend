import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { Game } from '../model/game.entity';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GameDetailService {

  constructor(
    @InjectRepository(Game) private readonly repo: Repository<Game>
  ) {
  }

  findOne(id: string): Observable<Game> {
    return from(this.repo.findOne({ where: { id }, relations: ['hostedBy', 'events', 'events.player', 'events.eventType'], withDeleted: true })).pipe(
      ensureExistence(),
    );
  }

  /**
   * @deprecated
   */
  findOneFull(id: string): Observable<Game> {
    return from(this.repo.findOne({ where: { id }, relations: ['rounds', 'hostedBy', 'events', 'events.player', 'events.eventType', 'rounds.events', 'rounds.events.player', 'rounds.events.eventType', 'rounds.attendees', 'rounds.finalists'], order: { rounds: { datetime: 'ASC' } }, withDeleted: true })).pipe(
      ensureExistence(),
    );
  }

  update(id: string, dto: UpdateGameDto): Observable<Game> {
    return from(this.repo.preload({ id, ...UpdateGameDto.mapForeignKeys(dto) })).pipe(
      ensureExistence(),
      switchMap(entity => from(this.repo.save(entity))),
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: string): Observable<string> {
    return from(this.repo.findOneByOrFail({ id })).pipe(
      switchMap(entity => from(this.repo.remove(entity))),
      map(() => id)
    );
  }

}
