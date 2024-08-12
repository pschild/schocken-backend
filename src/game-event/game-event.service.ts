import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
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
    const mappedDto = {
      ...dto,
      game: { id: dto.gameId },
      player: { id: dto.playerId },
    };
    return from(this.repo.save(mappedDto)).pipe(
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  findAll(): Observable<GameEventDto[]> {
    return from(this.repo.find()).pipe(
      map(GameEventDto.fromEntities)
    );
  }

  findOne(id: string): Observable<GameEventDto> {
    return from(this.repo.findOne({ where: { id } })).pipe(
      map(GameEventDto.fromEntity)
    );
  }

  update(id: string, dto: UpdateGameEventDto): Observable<GameEventDto> {
    const mappedDto = {
      ...dto,
      ...(dto.gameId ? { game: { id: dto.gameId } } : {}),
      ...(dto.playerId ? { player: { id: dto.playerId } } : {}),
    };
    return from(this.repo.update(id, mappedDto)).pipe(
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: string): Observable<string> {
    return from(this.repo.delete(id)).pipe(
      map(() => id)
    );
  }
}
