import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

  public async getAll(): Promise<PlayerDto[]> {
    return await this.repo.find()
      .then(entities => entities.map(e => this.toDto(e)));
  }

  public async create(dto: CreatePlayerDto): Promise<PlayerDto> {
    return this.repo.save(dto).then(e => this.toDto(e));
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
