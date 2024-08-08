import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GameDto } from './dto/game.dto';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Controller('game')
export class GameController {
  constructor(private readonly service: GameService) {}

  @Post()
  create(@Body() createGameDto: CreateGameDto): Observable<GameDto> {
    if (createGameDto.hostedById && createGameDto.placeOfAwayGame) {
      throw new BadRequestException('Properties `hostedById` and `placeOfAwayGame` must not be defined simultaneously.');
    }

    return this.service.create(createGameDto);
  }

  @Get()
  findAll(): Observable<GameDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<GameDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto): Observable<GameDto> {
    if (updateGameDto.hostedById && updateGameDto.placeOfAwayGame) {
      throw new BadRequestException('Properties `hostedById` and `placeOfAwayGame` must not be defined simultaneously.');
    }

    return this.service.update(id, updateGameDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
