import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameOverviewDto } from './dto/game-overview.dto';
import { GameOverviewService } from './game-overview.service';

@ApiTags('game-overview')
@Controller('game-overview')
export class GameOverviewController {
  constructor(private readonly overviewService: GameOverviewService) {}

  @Get()
  @ApiOkResponse({ type: [GameOverviewDto] })
  getOverview(): Observable<GameOverviewDto[]> {
    return this.overviewService.getOverview().pipe(
      map(GameOverviewDto.fromEntities)
    );
  }
}
