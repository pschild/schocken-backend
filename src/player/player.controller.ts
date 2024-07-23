import { Body, Controller, Get, Post } from '@nestjs/common';
import { Observable } from 'rxjs';
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
  public getAll(): Observable<PlayerDto[]> {
    return this.service.getAll();
  }

  @Post()
  public create(@Body() dto: CreatePlayerDto): Observable<PlayerDto> {
    return this.service.create(dto);
  }

}
