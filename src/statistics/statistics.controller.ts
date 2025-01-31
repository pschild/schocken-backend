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
      this.service.maxRoundsPerGame(config),
      this.service.penaltySum(config),
      this.service.euroPerGame(config),
      this.service.euroPerRound(config),
      this.service.mostExpensiveRound(config),
      this.service.mostExpensiveGame(config),
      this.service.mostExpensiveRoundAveragePerGame(config),
      this.service.hostsTable(config),
      this.service.attendancesTable(config),
      this.service.finalsTable(config),
      this.service.recordsPerGame(config),
      this.service.eventTypeStreaks(config, 'WITHOUT_EVENT'),
      this.service.eventTypeStreaks(config, 'WITH_EVENT'),
      this.service.penaltyStreak(config, 'NO_PENALTY'),
      this.service.penaltyStreak(config, 'AT_LEAST_ONE_PENALTY'),
      this.service.getSchockAusStreak(config),
      this.service.attendanceStreak(config),
      this.service.penaltyByPlayerTable(config),
      this.service.eventTypeCountsByPlayer(config, ['a7e6a6ac-0348-41df-9e36-1adc5eb12054']),
      this.service.eventTypeCounts(config),
    ]).then(([
      gameCount,
      roundCount,
      averageRoundsPerGame,
      maxRoundsPerGame,
      penaltySum,
      euroPerGame,
      euroPerRound,
      mostExpensiveRound,
      mostExpensiveGame,
      mostExpensiveRoundAveragePerGame,
      hostsTable,
      attendancesTable,
      finalsTable,
      recordsPerGame,
      noStreaks,
      streaks,
      noPenaltyStreak,
      penaltyStreak,
      schockAusStreak,
      attendanceStreak,
      penaltyByPlayerTable,
      eventTypeCountsByPlayer,
      eventTypeCounts
    ]) => ({
      gameCount,
      roundCount,
      averageRoundsPerGame,
      maxRoundsPerGame,
      penaltySum,
      euroPerGame,
      euroPerRound,
      mostExpensiveRound,
      mostExpensiveGame,
      mostExpensiveRoundAveragePerGame,
      hostsTable,
      attendancesTable,
      finalsTable,
      recordsPerGame,
      noStreaks,
      streaks,
      noPenaltyStreak,
      penaltyStreak,
      schockAusStreak,
      attendanceStreak,
      penaltyByPlayerTable,
      eventTypeCountsByPlayer,
      eventTypeCounts
    }));
  }

}
