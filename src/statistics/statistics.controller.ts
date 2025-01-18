import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @Get()
  @ApiOkResponse({ type: Number })
  async countGames(
    @Query('fromDate') fromDate: Date,
    @Query('toDate') toDate: Date,
    @Query('onlyActivePlayers') onlyActivePlayers: boolean
  ): Promise<unknown> {
    const config: { fromDate: Date, toDate: Date, onlyActivePlayers: boolean } = {
      fromDate,
      toDate,
      onlyActivePlayers
    };

    return Promise.all([
      this.service.countGames(config),
      this.service.countRounds(config),
      this.service.averageRoundsPerGame(config),
      this.service.penaltySum(config),
      this.service.euroPerGame(config),
      this.service.euroPerRound(config),
      this.service.mostExpensiveRound(config),
      this.service.mostExpensiveGame(config),
      this.service.mostExpensiveRoundAveragePerGame(config),
      this.service.hostsTable(config),
      this.service.attendancesTable(config),
    ]).then(([
      gameCount,
      roundCount,
      averageRoundsPerGame,
      penaltySum,
      euroPerGame,
      euroPerRound,
      mostExpensiveRound,
      mostExpensiveGame,
      mostExpensiveRoundAveragePerGame,
      hostsTable,
      attendancesTable,
    ]) => ({
      gameCount,
      roundCount,
      averageRoundsPerGame,
      penaltySum,
      euroPerGame,
      euroPerRound,
      mostExpensiveRound,
      mostExpensiveGame,
      mostExpensiveRoundAveragePerGame,
      hostsTable,
      attendancesTable,
    }));
  }

}
