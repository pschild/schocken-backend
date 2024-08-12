import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CreateGameEventDto } from './dto/create-game-event.dto';
import { GameEventDto } from './dto/game-event.dto';
import { UpdateGameEventDto } from './dto/update-game-event.dto';
import { GameEventService } from './game-event.service';

@Controller('game-event')
export class GameEventController {
  constructor(private readonly service: GameEventService) {}

  @Post()
  create(@Body() dto: CreateGameEventDto): Observable<GameEventDto> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Observable<GameEventDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<GameEventDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGameEventDto): Observable<GameEventDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
