import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { GameDetailDto } from './dto/game-detail.dto';
import { GameDto } from './dto/game.dto';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(private readonly service: GameService) {}

  @Post()
  create(@Body() dto: CreateGameDto): Observable<GameDto> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Observable<GameDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<GameDto> {
    return this.service.findOne(id);
  }

  @Get(':id/details')
  getDetails(@Param('id') id: string): Observable<GameDetailDto> {
    return this.service.getDetails(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGameDto): Observable<GameDto> {
    return this.service.update(id, dto);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string): Observable<GameDto> {
    // TODO: calculate points and persist ranking of players
    return this.service.update(id, { completed: true });
  }

  @Delete(':id')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
