import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CreatePlayerDto } from './create-player.dto';
import { PlayerDto } from './player.dto';
import { PlayerService } from './player.service';
import { UpdatePlayerDto } from './update-player.dto';

@Controller('player')
export class PlayerController {

  constructor(
    private service: PlayerService
  ) {
  }

  @Post()
  public create(@Body() dto: Partial<CreatePlayerDto>): Observable<PlayerDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  public findOne(@Param('id') id: string): Observable<PlayerDto> {
    return this.service.findOne(id);
  }

  @Get()
  public getAll(): Observable<PlayerDto[]> {
    return this.service.getAll();
  }

  @Get('active')
  public getAllActive(): Observable<PlayerDto[]> {
    return this.service.getAllActive();
  }

  @Put(':id')
  public update(@Param('id') id: string, @Body() dto: Partial<UpdatePlayerDto>): Observable<PlayerDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  public remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
