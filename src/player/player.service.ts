import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { Player } from '../model/player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerDto } from './dto/player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayerService {

  constructor(
    @InjectRepository(Player) private readonly repo: Repository<Player>
  ) {
  }

  public create(dto: CreatePlayerDto): Observable<PlayerDto> {
    return from(this.repo.save(CreatePlayerDto.mapForeignKeys(dto))).pipe(
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
    return from(this.repo.preload({ id, ...UpdatePlayerDto.mapForeignKeys(dto) })).pipe(
      ensureExistence(),
      switchMap(entity => from(this.repo.save(entity))),
      switchMap(() => this.findOne(id)),
    );
  }

  public remove(id: string): Observable<string> {
    return from(this.repo.findOneByOrFail({ id })).pipe(
      switchMap(entity => from(this.repo.softRemove(entity))), // SOFT remove!
      map(() => id)
    );
  }
}
