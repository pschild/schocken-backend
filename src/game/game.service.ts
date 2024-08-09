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

  create(dto: CreateGameDto): Observable<GameDto> {
    const mappedDto = {
      ...dto,
      hostedBy: { id: dto.hostedById }
    };
    return from(this.repo.save(mappedDto)).pipe(
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  findAll(): Observable<GameDto[]> {
    return from(this.repo.find({ relations: ['rounds', 'hostedBy'] })).pipe(
      map(GameDto.fromEntities)
    );
  }

  findOne(id: string): Observable<GameDto> {
    return from(this.repo.findOne({ where: { id }, relations: ['rounds', 'hostedBy'], withDeleted: true })).pipe(
      map(GameDto.fromEntity)
    );
  }

  update(id: string, dto: UpdateGameDto): Observable<GameDto> {
    const mappedDto = {
      ...dto,
      ...(dto.hostedById ? { hostedBy: { id: dto.hostedById } } : {}),
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
