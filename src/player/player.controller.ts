import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreatePlayerDto } from './create-player.dto';
import { PlayerDto } from './player.dto';
import { PlayerService } from './player.service';

@Controller('player')
export class PlayerController {

  constructor(
    private service: PlayerService
  ) {
  }

  @Get()
  public async getAll(): Promise<PlayerDto[]> {
    return await this.service.getAll();
  }

  @Post()
  public async post(@Body() dto: CreatePlayerDto): Promise<PlayerDto> {
    return this.service.create(dto);
  }

}
