import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { GameEvent } from '../model/game-event.entity';
import { CreateGameEventDto } from './dto/create-game-event.dto';
import { GameEventDto } from './dto/game-event.dto';
import { UpdateGameEventDto } from './dto/update-game-event.dto';

@Injectable()
export class GameEventService {

  constructor(
    @InjectRepository(GameEvent) private readonly repo: Repository<GameEvent>
  ) {
  }

  create(dto: CreateGameEventDto): Observable<GameEventDto> {
    return from(this.repo.save(CreateGameEventDto.mapForeignKeys(dto))).pipe(
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  findAll(): Observable<GameEventDto[]> {
    return from(this.repo.find()).pipe(
      map(GameEventDto.fromEntities)
    );
  }

  findOne(id: string): Observable<GameEventDto> {
    return from(this.repo.findOne({ where: { id }, relations: ['player', 'eventType'], withDeleted: true })).pipe(
      map(GameEventDto.fromEntity)
    );
  }

  update(id: string, dto: UpdateGameEventDto): Observable<GameEventDto> {
    return from(this.repo.preload({ id, ...UpdateGameEventDto.mapForeignKeys(dto) })).pipe(
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
