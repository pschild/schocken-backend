import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Cache } from 'cache-manager';
import { Permission } from '../auth/model/permission.enum';
import { Permissions } from '../auth/decorator/permission.decorator';
import { PenaltyDto } from '../penalty/dto/penalty.dto';
import { AttendanceStatisticsService } from './attendance/attendance-statistics.service';
import {
  AccumulatedPointsPerGameDto,
  CountByNameDto,
  CountDto,
  EventTypeCountsDto,
  EventTypeStreakDto,
  HostsTableDto,
  MostExpensiveGameDto,
  MostExpensiveRoundAveragePerGameDto,
  MostExpensiveRoundDto,
  PenaltyByPlayerTableDto,
  PointsPerGameDto,
  QuoteByNameDto, RecordDto,
  RecordsPerGameDto,
  RoundCountByGameIdDto,
  SchockAusEffectivityTableDto,
  SchockAusStreakDto,
  StreakDto
} from './dto';
import { LiveGamePointsTableDto } from './dto/live-game-points-table.dto';
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

export class LiveGameStatisticsRequestDto {

  @ApiProperty({ type: String })
  gameId: string;
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

export class EventTypeStatisticsRequestDto extends StatisticsRequestDto {

  @ApiProperty({ type: String })
  eventTypeId: string;
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

  @ApiProperty({ type: [EventTypeCountsDto] })
  eventTypeCounts: EventTypeCountsDto[];

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

  @ApiProperty({ type: [RecordDto] })
  maxGamePoints: RecordDto[];

  @ApiProperty({ type: [RecordDto] })
  minGamePoints: RecordDto[];
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

export class LiveGameStatisticsResponseDto {

  @ApiProperty({ type: [PenaltyDto] })
  penaltySum: PenaltyDto[];

  @ApiProperty({ type: CountDto })
  euroPerRound: CountDto;

  @ApiProperty({ type: [PenaltyByPlayerTableDto] })
  penaltyByPlayerTable: PenaltyByPlayerTableDto[];

  @ApiProperty({ type: SchockAusStreakDto })
  schockAusStreak: SchockAusStreakDto;

  @ApiProperty({ type: [RecordsPerGameDto] })
  recordsPerGame: RecordsPerGameDto[];

  @ApiProperty({ type: [LiveGamePointsTableDto] })
  pointsTable: LiveGamePointsTableDto[];
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
    private readonly pointsStatisticsService: PointsStatisticsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get('all-games')
  @Permissions([Permission.READ_STATISTICS])
  @ApiOkResponse({ type: [GameIdsWithDatetimeDto] })
  async allGames(): Promise<GameIdsWithDatetimeDto[]> {
    return this.gameStatisticsService.games();
  }

  @Post('games-rounds')
  @Permissions([Permission.READ_STATISTICS])
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
  @Permissions([Permission.READ_STATISTICS])
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
  @Permissions([Permission.READ_STATISTICS])
  @ApiOkResponse({ type: [CountByNameDto] })
  async eventTypeCountsByPlayer(@Body() body: EventTypeStatisticsRequestDto): Promise<CountByNameDto[]> {
    const { fromDate, toDate, onlyActivePlayers, eventTypeId } = body;
    const gameIds = await this.gameStatisticsService.gameIds(fromDate, toDate);
    return this.eventTypesStatisticsService.eventTypeCountsByPlayer(gameIds, onlyActivePlayers, eventTypeId);
  }

  @Post('penalty')
  @Permissions([Permission.READ_STATISTICS])
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
      this.penaltyStatisticsService.euroPenaltyByPlayerTable(selectedGameIds, onlyActivePlayers),
    ]);
    return { penaltySum, euroPerGame, euroPerRound, mostExpensiveRound, mostExpensiveGame, mostExpensiveRoundAveragePerGame, penaltyByPlayerTable };
  }

  @Post('streaks')
  @Permissions([Permission.READ_STATISTICS])
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
  @Permissions([Permission.READ_STATISTICS])
  @ApiOkResponse({ type: PointsStatisticsResponseDto })
  async pointsStatistics(@Body() body: StatisticsRequestDto): Promise<PointsStatisticsResponseDto> {
    const { fromDate, toDate, gameIds, onlyActivePlayers } = body;
    const selectedGameIds = await this.validateAndGetGameIds(fromDate, toDate, gameIds);

    const [pointsPerGame, accumulatedPoints, maxGamePoints, minGamePoints] = await Promise.all([
      this.pointsStatisticsService.pointsPerGame(selectedGameIds, onlyActivePlayers),
      this.pointsStatisticsService.accumulatedPoints(selectedGameIds, onlyActivePlayers),
      this.pointsStatisticsService.maxGamePoints(selectedGameIds, onlyActivePlayers),
      this.pointsStatisticsService.minGamePoints(selectedGameIds, onlyActivePlayers),
    ]);
    return { pointsPerGame, accumulatedPoints, maxGamePoints, minGamePoints };
  }

  @Post('hosts')
  @Permissions([Permission.READ_STATISTICS])
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
  @Permissions([Permission.READ_STATISTICS])
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

  @Post('live-game')
  @Permissions([Permission.READ_STATISTICS])
  @ApiOkResponse({ type: LiveGameStatisticsResponseDto })
  async liveGameStatistics(@Body() body: LiveGameStatisticsRequestDto): Promise<LiveGameStatisticsResponseDto> {
    const { gameId } = body;
    const selectedGameIds = [gameId];

    await this.cacheManager.clear();

    const pointsTable = await this.pointsStatisticsService.liveGamePointsTable(gameId);

    const [penaltySum, euroPerRound, penaltyByPlayerTable, schockAusStreak, recordsPerGame] = await Promise.all([
      this.penaltyStatisticsService.penaltySum(selectedGameIds, true),
      this.penaltyStatisticsService.euroPerRound(selectedGameIds, true),
      this.penaltyStatisticsService.euroPenaltyByPlayerTable(selectedGameIds, true),
      this.streakStatisticsService.getSchockAusStreak(selectedGameIds),
      this.eventTypesStatisticsService.recordsPerGame(selectedGameIds, true),
    ]);
    return { pointsTable, penaltySum, euroPerRound, penaltyByPlayerTable, schockAusStreak, recordsPerGame };
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
