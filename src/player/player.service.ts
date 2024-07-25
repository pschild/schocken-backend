import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../model/player.entity';
import { PlayerDto } from './player.dto';
import { CreatePlayerDto } from './create-player.dto';
import { UpdatePlayerDto } from './update-player.dto';

@Injectable()
export class PlayerService {

  constructor(
    @InjectRepository(PlayerEntity) private readonly repo: Repository<PlayerEntity>
  ) {
  }

  public create(dto: Partial<CreatePlayerDto>): Observable<PlayerDto> {
    return from(this.repo.save(dto)).pipe(
      map(e => this.toDto(e))
    );
  }

  public findOne(id: string): Observable<PlayerDto> {
    return from(this.repo.findOneBy({ id })).pipe(
      map(e => this.toDto(e))
    );
  }

  public getAll(): Observable<PlayerDto[]> {
    return from(this.repo.find()).pipe(
      map(entities => entities.map(e => this.toDto(e)))
    );
  }

  public getAllActive(): Observable<PlayerDto[]> {
    return from(this.repo.findBy({ active: true })).pipe(
      map(entities => entities.map(e => this.toDto(e)))
    );
  }

  public update(id: string, dto: Partial<UpdatePlayerDto>): Observable<PlayerDto> {
    return from(this.repo.update(id, dto)).pipe(
      switchMap(() => this.findOne(id)),
    );
  }

  public remove(id: string): Observable<string> {
    return from(this.repo.delete(id)).pipe(
      map(() => id)
    );
  }

  private toDto(entity: PlayerEntity): PlayerDto {
    return !entity
      ? null
      : {
        id: entity.id,
        createDateTime: entity.createDateTime.toISOString(),
        lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
        name: entity.name,
        registered: entity.registered.toISOString(),
        active: entity.active,
      };
  }
}
