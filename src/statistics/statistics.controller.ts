import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { PenaltyDto } from '../penalty/dto/penalty.dto';
import { AttendanceStatisticsService } from './attendance/attendance-statistics.service';
import {
  AccumulatedPointsPerGameDto,
  CountByNameDto,
  CountDto,
  EventTypeStreakDto,
  HostsTableDto,
  MostExpensiveGameDto,
  MostExpensiveRoundAveragePerGameDto,
  MostExpensiveRoundDto,
  PenaltyByPlayerTableDto,
  PointsPerGameDto,
  QuoteByNameDto,
  RecordsPerGameDto,
  RoundCountByGameIdDto,
  SchockAusEffectivityTableDto,
  SchockAusStreakDto,
  StreakDto
} from './dto';
import { EventTypesStatisticsService } from './event-types/event-types-statistics.service';
import { GameStatisticsService } from './game/game-statistics.service';
import { HostingStatisticsService } from './hosting/hosting-statistics.service';
import { PenaltyStatisticsService } from './penalty/penalty-statistics.service';
import { PointsStatisticsService } from './points/points-statistics.service';
import { RoundStatisticsService } from './round/round-statistics.service';
import { EventTypeStreakModeEnum } from './streak/enum/event-type-streak-mode.enum';
import { PenaltyStreakModeEnum } from './streak/enum/penalty-streak-mode.enum';
import { StreakStatisticsService } from './streak/streak-statistics.service';

export class GameIdsWithDatetimeDto {

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: Date;
}

export class StatisticsRequestDto {

  @ApiPropertyOptional({ type: Date })
  fromDate?: Date;

  @ApiPropertyOptional({ type: Date })
  toDate?: Date;

  @ApiPropertyOptional({ type: [String] })
  gameIds?: string[];

  @ApiProperty({ type: Boolean })
  onlyActivePlayers: boolean;
}

export class GamesAndRoundsStatisticsResponseDto {

  @ApiProperty({ type: CountDto })
  countGames: CountDto;

  @ApiProperty({ type: CountDto })
  countRounds: CountDto;

  @ApiProperty({ type: CountDto })
  averageRoundsPerGame: CountDto;

  @ApiProperty({ type: RoundCountByGameIdDto })
  maxRoundsPerGame: RoundCountByGameIdDto;
}

export class EventTypesStatisticsResponseDto {

  @ApiProperty({ type: [RecordsPerGameDto] })
  recordsPerGame: RecordsPerGameDto[];

  @ApiProperty({ type: [CountByNameDto] })
  eventTypeCounts: CountByNameDto[];

  @ApiProperty({ type: [SchockAusEffectivityTableDto] })
  schockAusEffectivityTable: SchockAusEffectivityTableDto[];
}

export class StreakStatisticsResponseDto {

  @ApiProperty({ type: [EventTypeStreakDto] })
  noEventTypeStreaks: EventTypeStreakDto[];

  @ApiProperty({ type: [EventTypeStreakDto] })
  eventTypeStreaks: EventTypeStreakDto[];

  @ApiProperty({ type: [StreakDto] })
  noPenaltyStreaks: StreakDto[];

  @ApiProperty({ type: [StreakDto] })
  penaltyStreaks: StreakDto[];

  @ApiProperty({ type: SchockAusStreakDto })
  schockAusStreak: SchockAusStreakDto;

  @ApiProperty({ type: [StreakDto] })
  attendanceStreaks: StreakDto[];

}

export class PenaltyStatisticsResponseDto {

  @ApiProperty({ type: [PenaltyDto] })
  penaltySum: PenaltyDto[];

  @ApiProperty({ type: CountDto })
  euroPerGame: CountDto;

  @ApiProperty({ type: CountDto })
  euroPerRound: CountDto;

  @ApiProperty({ type: MostExpensiveRoundDto })
  mostExpensiveRound: MostExpensiveRoundDto;

  @ApiProperty({ type: MostExpensiveGameDto })
  mostExpensiveGame: MostExpensiveGameDto;

  @ApiProperty({ type: MostExpensiveRoundAveragePerGameDto })
  mostExpensiveRoundAveragePerGame: MostExpensiveRoundAveragePerGameDto;

  @ApiProperty({ type: [PenaltyByPlayerTableDto] })
  penaltyByPlayerTable: PenaltyByPlayerTableDto[];
}

export class PointsStatisticsResponseDto {

  @ApiProperty({ type: [PointsPerGameDto] })
  pointsPerGame: PointsPerGameDto[];

  @ApiProperty({ type: [AccumulatedPointsPerGameDto] })
  accumulatedPoints: AccumulatedPointsPerGameDto[];
}

export class HostStatisticsResponseDto {

  @ApiProperty({ type: [HostsTableDto] })
  hostsTable: HostsTableDto[];
}

export class AttendancesStatisticsResponseDto {

  @ApiProperty({ type: [QuoteByNameDto] })
  attendancesTable: QuoteByNameDto[];

  @ApiProperty({ type: [QuoteByNameDto] })
  finalsTable: QuoteByNameDto[];
}

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly gameStatisticsService: GameStatisticsService,
    private readonly roundStatisticsService: RoundStatisticsService,
    private readonly eventTypesStatisticsService: EventTypesStatisticsService,
    private readonly hostingStatisticsService: HostingStatisticsService,
    private readonly attendanceStatisticsService: AttendanceStatisticsService,
    private readonly penaltyStatisticsService: PenaltyStatisticsService,
    private readonly streakStatisticsService: StreakStatisticsService,
    private readonly pointsStatisticsService: PointsStatisticsService
  ) {}

  @Get('all-games')
  @ApiOkResponse({ type: [GameIdsWithDatetimeDto] })
  async allGames(): Promise<GameIdsWithDatetimeDto[]> {
    return this.gameStatisticsService.games();
  }

  @Post('games-rounds')
  @ApiOkResponse({ type: GamesAndRoundsStatisticsResponseDto })
  async gamesAndRoundsStatistics(@Body() body: StatisticsRequestDto): Promise<GamesAndRoundsStatisticsResponseDto> {
    const { fromDate, toDate, gameIds } = body;
    const selectedGameIds = await this.validateAndGetGameIds(fromDate, toDate, gameIds);

    const [countGames, countRounds, averageRoundsPerGame, maxRoundsPerGame] = await Promise.all([
      this.gameStatisticsService.countGames(selectedGameIds),
      this.roundStatisticsService.countRounds(selectedGameIds),
      this.roundStatisticsService.averageRoundsPerGame(selectedGameIds),
      this.roundStatisticsService.maxRoundsPerGame(selectedGameIds),
    ]);
    return { countGames, countRounds, averageRoundsPerGame, maxRoundsPerGame };
  }

  @Post('event-types')
  @ApiOkResponse({ type: EventTypesStatisticsResponseDto })
  async eventTypeStatistics(@Body() body: StatisticsRequestDto): Promise<EventTypesStatisticsResponseDto> {
    const { fromDate, toDate, gameIds, onlyActivePlayers } = body;
    const selectedGameIds = await this.validateAndGetGameIds(fromDate, toDate, gameIds);

    const [recordsPerGame, eventTypeCounts, schockAusEffectivityTable] = await Promise.all([
      this.eventTypesStatisticsService.recordsPerGame(selectedGameIds, onlyActivePlayers),
      this.eventTypesStatisticsService.eventTypeCounts(selectedGameIds, onlyActivePlayers),
      this.eventTypesStatisticsService.schockAusEffectivityTable(selectedGameIds, onlyActivePlayers),
    ]);
    return { recordsPerGame, eventTypeCounts, schockAusEffectivityTable };
  }

  @Post('event-type-counts')
  @ApiOkResponse({ type: [CountByNameDto] })
  async eventTypeCountsByPlayer(
    @Body() body: StatisticsRequestDto & { eventTypeId: string; }
  ): Promise<CountByNameDto[]> {
    const { fromDate, toDate, onlyActivePlayers, eventTypeId } = body;
    const gameIds = await this.gameStatisticsService.gameIds(fromDate, toDate);
    return this.eventTypesStatisticsService.eventTypeCountsByPlayer(gameIds, onlyActivePlayers, eventTypeId);
  }

  @Post('penalty')
  @ApiOkResponse({ type: PenaltyStatisticsResponseDto })
  async penaltyStatistics(@Body() body: StatisticsRequestDto): Promise<PenaltyStatisticsResponseDto> {
    const { fromDate, toDate, gameIds, onlyActivePlayers } = body;
    const selectedGameIds = await this.validateAndGetGameIds(fromDate, toDate, gameIds);

    const [penaltySum, euroPerGame, euroPerRound, mostExpensiveRound, mostExpensiveGame, mostExpensiveRoundAveragePerGame, penaltyByPlayerTable] = await Promise.all([
      this.penaltyStatisticsService.penaltySum(selectedGameIds, onlyActivePlayers),
      this.penaltyStatisticsService.euroPerGame(selectedGameIds, onlyActivePlayers),
      this.penaltyStatisticsService.euroPerRound(selectedGameIds, onlyActivePlayers),
      this.penaltyStatisticsService.mostExpensiveRound(selectedGameIds, onlyActivePlayers),
      this.penaltyStatisticsService.mostExpensiveGame(selectedGameIds, onlyActivePlayers),
      this.penaltyStatisticsService.mostExpensiveRoundAveragePerGame(selectedGameIds, onlyActivePlayers),
      this.penaltyStatisticsService.penaltyByPlayerTable(selectedGameIds, onlyActivePlayers),
    ]);
    return { penaltySum, euroPerGame, euroPerRound, mostExpensiveRound, mostExpensiveGame, mostExpensiveRoundAveragePerGame, penaltyByPlayerTable };
  }

  @Post('streaks')
  @ApiOkResponse({ type: StreakStatisticsResponseDto })
  async streakStatistics(@Body() body: StatisticsRequestDto): Promise<StreakStatisticsResponseDto> {
    const { fromDate, toDate, gameIds, onlyActivePlayers } = body;
    const selectedGameIds = await this.validateAndGetGameIds(fromDate, toDate, gameIds);

    const [noEventTypeStreaks, eventTypeStreaks, noPenaltyStreaks, penaltyStreaks, schockAusStreak, attendanceStreaks] = await Promise.all([
      this.streakStatisticsService.eventTypeStreaks(selectedGameIds, onlyActivePlayers, EventTypeStreakModeEnum.WITHOUT_EVENT),
      this.streakStatisticsService.eventTypeStreaks(selectedGameIds, onlyActivePlayers, EventTypeStreakModeEnum.WITH_EVENT),
      this.streakStatisticsService.penaltyStreak(selectedGameIds, onlyActivePlayers, PenaltyStreakModeEnum.NO_PENALTY),
      this.streakStatisticsService.penaltyStreak(selectedGameIds, onlyActivePlayers, PenaltyStreakModeEnum.AT_LEAST_ONE_PENALTY),
      this.streakStatisticsService.getSchockAusStreak(selectedGameIds),
      this.streakStatisticsService.attendanceStreak(selectedGameIds, onlyActivePlayers),
    ]);
    return { noEventTypeStreaks, eventTypeStreaks, noPenaltyStreaks, penaltyStreaks, schockAusStreak, attendanceStreaks };
  }

  @Post('points')
  @ApiOkResponse({ type: PointsStatisticsResponseDto })
  async pointsStatistics(@Body() body: StatisticsRequestDto): Promise<PointsStatisticsResponseDto> {
    const { fromDate, toDate, gameIds, onlyActivePlayers } = body;
    const selectedGameIds = await this.validateAndGetGameIds(fromDate, toDate, gameIds);

    const [pointsPerGame, accumulatedPoints] = await Promise.all([
      this.pointsStatisticsService.pointsPerGame(selectedGameIds, onlyActivePlayers),
      this.pointsStatisticsService.accumulatedPoints(selectedGameIds, onlyActivePlayers),
    ]);
    return { pointsPerGame, accumulatedPoints };
  }

  @Post('hosts')
  @ApiOkResponse({ type: HostStatisticsResponseDto })
  async hostStatistics(@Body() body: StatisticsRequestDto): Promise<HostStatisticsResponseDto> {
    const { fromDate, toDate, gameIds, onlyActivePlayers } = body;
    const selectedGameIds = await this.validateAndGetGameIds(fromDate, toDate, gameIds);

    const [hostsTable] = await Promise.all([
      this.hostingStatisticsService.hostsTable(selectedGameIds, onlyActivePlayers),
    ]);
    return { hostsTable };
  }

  @Post('attendances')
  @ApiOkResponse({ type: AttendancesStatisticsResponseDto })
  async attendancesStatistics(@Body() body: StatisticsRequestDto): Promise<AttendancesStatisticsResponseDto> {
    const { fromDate, toDate, gameIds, onlyActivePlayers } = body;
    const selectedGameIds = await this.validateAndGetGameIds(fromDate, toDate, gameIds);

    const [attendancesTable, finalsTable] = await Promise.all([
      this.attendanceStatisticsService.attendancesTable(selectedGameIds, onlyActivePlayers),
      this.attendanceStatisticsService.finalsTable(selectedGameIds, onlyActivePlayers),
    ]);
    return { attendancesTable, finalsTable };
  }

  private async validateAndGetGameIds(fromDate: Date, toDate: Date, gameIds: string[]): Promise<string[]> {
    if (gameIds && gameIds.length) {
      return gameIds;
    } else if (fromDate && toDate) {
      return this.gameStatisticsService.gameIds(fromDate, toDate);
    }
    throw new Error(`Invalid request params - cannot load statistics`);
  }

}
