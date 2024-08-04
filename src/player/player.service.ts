import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../model/player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerDto } from './dto/player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { DuplicateUsernameException } from './exception/duplicate-username.exception';

@Injectable()
export class PlayerService {

  constructor(
    @InjectRepository(PlayerEntity) private readonly repo: Repository<PlayerEntity>
  ) {
  }

  public create(dto: CreatePlayerDto): Observable<PlayerDto> {
    return from(this.repo.findOneBy({ name: dto.name })).pipe(
      switchMap(found => found
        ? throwError(() => new DuplicateUsernameException())
        : from(this.repo.save(dto))
      ),
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  public findOne(id: string): Observable<PlayerDto> {
    return from(this.repo.findOneBy({ id })).pipe(
      map(PlayerDto.fromEntity)
    );
  }

  public findAll(): Observable<PlayerDto[]> {
    return from(this.repo.find()).pipe(
      map(PlayerDto.fromEntities)
    );
  }

  public findAllActive(): Observable<PlayerDto[]> {
    return from(this.repo.findBy({ active: true })).pipe(
      map(PlayerDto.fromEntities)
    );
  }

  public update(id: string, dto: UpdatePlayerDto): Observable<PlayerDto> {
    return from(this.repo.update(id, dto)).pipe(
      switchMap(() => this.findOne(id)),
    );
  }

  public remove(id: string): Observable<string> {
    return from(this.repo.delete(id)).pipe(
      map(() => id)
    );
  }
}
