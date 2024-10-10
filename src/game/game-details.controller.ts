import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameDetailFullDto } from './dto/game-detail-full.dto';
import { GameDetailDto } from './dto/game-detail.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameDetailService } from './game-detail.service';
import { GameService } from './game.service';

@ApiTags('game-details')
@Controller('game-details')
export class GameDetailsController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameDetailService: GameDetailService
  ) {}

  @Get(':id/details')
  @ApiOkResponse({ type: GameDetailDto })
  getDetails(@Param('id') id: string): Observable<GameDetailDto> {
    return this.gameDetailService.findOne(id).pipe(
      map(GameDetailDto.fromEntity)
    );
  }

  @Get(':id/details/full')
  @ApiOkResponse({ type: GameDetailFullDto })
  getDetailsFull(@Param('id') id: string): Observable<GameDetailFullDto> {
    return this.gameDetailService.findOneFull(id).pipe(
      map(GameDetailFullDto.fromEntity)
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: GameDetailDto })
  update(@Param('id') id: string, @Body() dto: UpdateGameDto): Observable<GameDetailDto> {
    return this.gameDetailService.update(id, dto).pipe(
      map(GameDetailDto.fromEntity)
    );
  }
}
