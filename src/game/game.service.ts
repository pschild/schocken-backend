import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { Game } from '../model/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { GameDto } from './dto/game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GameService {

  constructor(
    @InjectRepository(Game) private readonly repo: Repository<Game>
  ) {
  }

  create(createGameDto: CreateGameDto): Observable<GameDto> {
    return from(this.repo.save(createGameDto)).pipe(
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  findAll(): Observable<GameDto[]> {
    return from(this.repo.find({ relations: ['rounds'] })).pipe(
      map(GameDto.fromEntities)
    );
  }

  findOne(id: string): Observable<GameDto> {
    return from(this.repo.findOne({ where: { id }, relations: ['rounds'] })).pipe(
      map(GameDto.fromEntity)
    );
  }

  update(id: string, updateGameDto: UpdateGameDto): Observable<GameDto> {
    return from(this.repo.update(id, updateGameDto)).pipe(
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: string): Observable<string> {
    return from(this.repo.delete(id)).pipe(
      map(() => id)
    );
  }
}
