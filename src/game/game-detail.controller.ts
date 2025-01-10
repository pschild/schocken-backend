import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateGameDto } from './dto/create-game.dto';
import { GameDetailDto } from './dto/game-detail.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameDetailService } from './game-detail.service';

@ApiTags('game-details')
@Controller('game-details')
export class GameDetailController {
  constructor(private readonly service: GameDetailService) {}

  @Post()
  @ApiBody({ type: CreateGameDto })
  @ApiCreatedResponse({ type: GameDetailDto })
  create(@Body() dto: CreateGameDto): Observable<GameDetailDto> {
    return this.service.create(dto).pipe(
      map(GameDetailDto.fromEntity)
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: GameDetailDto })
  findOne(@Param('id') id: string): Observable<GameDetailDto> {
    return this.service.findOne(id).pipe(
      map(GameDetailDto.fromEntity)
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: GameDetailDto })
  update(@Param('id') id: string, @Body() dto: UpdateGameDto): Observable<GameDetailDto> {
    return this.service.update(id, dto).pipe(
      map(GameDetailDto.fromEntity)
    );
  }

  @Delete(':id')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }
}
