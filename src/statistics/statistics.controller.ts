import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @Post('by-game-ids')
  // @ApiOkResponse({ type: Number })
  async statisticsByGameIds(
    @Body() body: { gameIds: string[]; onlyActivePlayers: boolean }
  ): Promise<unknown> {
    const { gameIds, onlyActivePlayers } = body;
    return this.getStatistics(gameIds, onlyActivePlayers);
  }

  @Post()
  // @ApiOkResponse({ type: Number })
  async statisticsByDateSpan(
    @Body() body: { fromDate: Date; toDate: Date; onlyActivePlayers: boolean }
  ): Promise<unknown> {
    const { fromDate, toDate, onlyActivePlayers } = body;
    const gameIds = await this.service.gameIds(fromDate, toDate);
    return this.getStatistics(gameIds, onlyActivePlayers);
  }

  private getStatistics(gameIds: string[], onlyActivePlayers: boolean): Promise<unknown> {
    return Promise.all([
      this.service.countGames(gameIds),
      this.service.countRounds(gameIds),
      this.service.averageRoundsPerGame(gameIds),
      this.service.maxRoundsPerGame(gameIds),
      this.service.penaltySum(gameIds, onlyActivePlayers),
      this.service.euroPerGame(gameIds, onlyActivePlayers),
      this.service.euroPerRound(gameIds, onlyActivePlayers),
      this.service.mostExpensiveRound(gameIds, onlyActivePlayers),
      this.service.mostExpensiveGame(gameIds, onlyActivePlayers),
      this.service.mostExpensiveRoundAveragePerGame(gameIds, onlyActivePlayers),
      this.service.hostsTable(gameIds, onlyActivePlayers),
      this.service.attendancesTable(gameIds, onlyActivePlayers),
      this.service.finalsTable(gameIds, onlyActivePlayers),
      this.service.recordsPerGame(gameIds, onlyActivePlayers),
      this.service.eventTypeStreaks(gameIds, onlyActivePlayers, 'WITHOUT_EVENT'),
      this.service.eventTypeStreaks(gameIds, onlyActivePlayers, 'WITH_EVENT'),
      this.service.penaltyStreak(gameIds, onlyActivePlayers, 'NO_PENALTY'),
      this.service.penaltyStreak(gameIds, onlyActivePlayers, 'AT_LEAST_ONE_PENALTY'),
      this.service.getSchockAusStreak(gameIds),
      this.service.attendanceStreak(gameIds, onlyActivePlayers),
      this.service.penaltyByPlayerTable(gameIds, onlyActivePlayers),
      this.service.eventTypeCountsByPlayer(gameIds, onlyActivePlayers, ['a7e6a6ac-0348-41df-9e36-1adc5eb12054']),
      this.service.eventTypeCounts(gameIds, onlyActivePlayers),
      this.service.schockAusEffectivityTable(gameIds, onlyActivePlayers),
      this.service.pointsPerGame(gameIds, onlyActivePlayers),
      this.service.accumulatedPoints(gameIds, onlyActivePlayers),
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
                                      eventTypeCounts,
                                      schockAusEffectivityTable,
                                      points,
                                      accumulatedPoints
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
      eventTypeCounts,
      schockAusEffectivityTable,
      points,
      accumulatedPoints
    }));
  }

}
