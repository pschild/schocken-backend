import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { defaultIfEmpty, from, Observable, switchMap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { Player } from '../model/player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayerService {

  constructor(
    @InjectRepository(Player) private readonly repo: Repository<Player>
  ) {
  }

  public create(dto: CreatePlayerDto): Observable<Player> {
    return from(this.repo.save(CreatePlayerDto.mapForeignKeys(dto))).pipe(
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  public findOne(id: string): Observable<Player> {
    return from(this.repo.findOneBy({ id }));
  }

  public findAll(): Observable<Player[]> {
    return from(this.repo.find({ order: { name: 'ASC' }, withDeleted: true }));
  }

  public findAllActive(): Observable<Player[]> {
    return from(this.repo.findBy({ active: true }));
  }

  public getPlayerByUserId(userId: string): Observable<Player> {
    return from(this.repo.findOneBy({auth0UserId: userId})).pipe(
      filter(entity => !!entity),
      defaultIfEmpty(null),
    );
  }

  public update(id: string, dto: UpdatePlayerDto): Observable<Player> {
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
