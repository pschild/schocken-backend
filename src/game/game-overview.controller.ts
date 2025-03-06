import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Roles } from '../auth/decorator/role.decorator';
import { Role } from '../auth/model/role.enum';
import { GameOverviewOfYearDto } from './dto/game-overview-of-year.dto';
import { GameOverviewDto } from './dto/game-overview.dto';
import { GameOverviewService } from './game-overview.service';

@ApiTags('game-overview')
@Controller('game-overview')
export class GameOverviewController {
  constructor(private readonly overviewService: GameOverviewService) {}

  @Get()
  @Roles([Role.PLAYER])
  @ApiOkResponse({ type: [GameOverviewOfYearDto] })
  getOverview(): Observable<GameOverviewOfYearDto[]> {
    return this.overviewService.getOverview().pipe(
      map(overviewItems =>
        overviewItems.map(item => ({...item, games: GameOverviewDto.fromEntities(item.games)}))
      )
    );
  }
}
