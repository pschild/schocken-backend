import { Controller, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GameOverviewDto } from './dto/game-overview.dto';
import { GameService } from './game.service';

@Controller('game-overview')
export class GameOverviewController {
  constructor(private readonly service: GameService) {}

  @Get()
  getOverview(): Observable<GameOverviewDto[]> {
    return this.service.getOverview();
  }
}
