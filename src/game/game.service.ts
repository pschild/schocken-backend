import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { Game } from '../model/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GameService {

  constructor(
    @InjectRepository(Game) private readonly repo: Repository<Game>
  ) {
  }

  create(dto: CreateGameDto): Observable<Game> {
    return from(this.repo.save(CreateGameDto.mapForeignKeys(dto))).pipe(
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  findAll(): Observable<Game[]> {
    return from(this.repo.find({ relations: ['rounds', 'hostedBy'] }));
  }

  findOne(id: string): Observable<Game> {
    return from(this.repo.findOneOrFail({ where: { id }, relations: ['hostedBy', 'rounds'], withDeleted: true }));
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
