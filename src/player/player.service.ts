import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../model/player.entity';
import { CreatePlayerDto } from './create-player.dto';
import { PlayerDto } from './player.dto';

@Injectable()
export class PlayerService {

  constructor(
    @InjectRepository(PlayerEntity) private readonly repo: Repository<PlayerEntity>
  ) {
  }

  public getAll(): Observable<PlayerDto[]> {
    return from(this.repo.find()).pipe(
      map(entities => entities.map(e => this.toDto(e)))
    );
  }

  public create(dto: CreatePlayerDto): Observable<PlayerDto> {
    return from(this.repo.save(dto)).pipe(
      map(e => this.toDto(e))
    );
  }

  private toDto(entity: PlayerEntity): PlayerDto {
    return {
      id: entity.id,
      createDateTime: entity.createDateTime.toISOString(),
      lastChangedDateTime: entity.lastChangedDateTime.toISOString(),
      name: entity.name,
      registered: entity.registered.toISOString(),
      active: entity.active,
    };
  }
}
