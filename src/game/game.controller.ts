import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateGameDto } from './dto/create-game.dto';
import { GameDto } from './dto/game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameService } from './game.service';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(private readonly service: GameService) {}

  @Post()
  @ApiBody({ type: CreateGameDto })
  @ApiCreatedResponse({ type: GameDto })
  create(@Body() dto: CreateGameDto): Observable<GameDto> {
    return this.service.create(dto).pipe(
      map(GameDto.fromEntity)
    );
  }

  @Get()
  @ApiOkResponse({ type: [GameDto] })
  findAll(): Observable<GameDto[]> {
    return this.service.findAll().pipe(
      map(GameDto.fromEntities)
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: GameDto })
  findOne(@Param('id') id: string): Observable<GameDto> {
    return this.service.findOne(id).pipe(
      map(GameDto.fromEntity)
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: GameDto })
  update(@Param('id') id: string, @Body() dto: UpdateGameDto): Observable<GameDto> {
    return this.service.update(id, dto).pipe(
      map(GameDto.fromEntity)
    );
  }

  @Patch(':id/complete')
  @ApiOkResponse({ type: GameDto })
  complete(@Param('id') id: string): Observable<GameDto> {
    // TODO: calculate points and persist ranking of players
    return this.service.update(id, { completed: true }).pipe(
      map(GameDto.fromEntity)
    );
  }

  @Delete(':id')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
