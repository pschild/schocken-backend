import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { GameOverviewDto } from './dto/game-overview.dto';
import { GameService } from './game.service';

@ApiTags('game-overview')
@Controller('game-overview')
export class GameOverviewController {
  constructor(private readonly service: GameService) {}

  @Get()
  @ApiOkResponse({ type: [GameOverviewDto] })
  getOverview(): Observable<GameOverviewDto[]> {
    return this.service.getOverview();
  }
}
