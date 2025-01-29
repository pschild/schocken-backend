import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PlaceType } from '../game/enum/place-type.enum';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PenaltyDto } from '../penalty/dto/penalty.dto';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { MockType, RANDOM_UUID } from '../test.utils';
import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let dataSourceMock: MockType<DataSource>;
  let gameRepositoryMock: MockType<Repository<Game>>;
  let roundRepositoryMock: MockType<Repository<Round>>;
  let eventRepositoryMock: MockType<Repository<Event>>;
  let playerRepositoryMock: MockType<Repository<Player>>;

  const mockConfig = { fromDate: new Date(), toDate: new Date(), onlyActivePlayers: true };

  const queryBuilderMock = (v) => ({
    select: jest.fn().mockImplementation(() => queryBuilderMock(v)),
    where: jest.fn().mockImplementation(() => queryBuilderMock(v)),
    andWhere: jest.fn().mockImplementation(() => queryBuilderMock(v)),
    groupBy: jest.fn().mockImplementation(() => queryBuilderMock(v)),
    addGroupBy: jest.fn().mockImplementation(() => queryBuilderMock(v)),
    getRawMany: jest.fn().mockReturnValue(Promise.resolve(v)),
  });

  const dataSourceMockFactory: () => MockType<DataSource> = jest.fn(() => ({
    query: jest.fn()
  }));

  const gameRepositoryMockFactory: () => MockType<Repository<Game>> = jest.fn(() => ({
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilderMock([])),
  }));

  const roundRepositoryMockFactory: () => MockType<Repository<Round>> = jest.fn(() => ({
    find: jest.fn(),
  }));

  const eventRepositoryMockFactory: () => MockType<Repository<Event>> = jest.fn(() => ({
    find: jest.fn(),
  }));

  const playerRepositoryMockFactory: () => MockType<Repository<Player>> = jest.fn(() => ({
    find: jest.fn(),
  }));

  const createEvent = (penaltyUnit: PenaltyUnit, penaltyValue: number, multiplicatorValue: number) => {
    return { id: RANDOM_UUID(), penaltyUnit, penaltyValue, multiplicatorValue } as Event;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: DataSource,
          useFactory: dataSourceMockFactory,
        },
        {
          provide: getRepositoryToken(Game),
          useFactory: gameRepositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Round),
          useFactory: roundRepositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Event),
          useFactory: eventRepositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Player),
          useFactory: playerRepositoryMockFactory,
        }
      ],
    }).compile();

    service = moduleRef.get(StatisticsService);
    dataSourceMock = moduleRef.get(DataSource);
    gameRepositoryMock = moduleRef.get(getRepositoryToken(Game));
    roundRepositoryMock = moduleRef.get(getRepositoryToken(Round));
    eventRepositoryMock = moduleRef.get(getRepositoryToken(Event));
    playerRepositoryMock = moduleRef.get(getRepositoryToken(Player));
  });

  describe('gameIds', () => {
    it('should return empty list if list is empty', async () => {
      jest.spyOn(gameRepositoryMock, 'find').mockReturnValue(Promise.resolve([]));

      const result = await service.gameIds(new Date(), new Date());

      expect(result).toEqual([]);
    });

    it('should return list of ids', async () => {
      jest.spyOn(gameRepositoryMock, 'find').mockReturnValue(Promise.resolve([
        { id: 'id1' },
        { id: 'id2' },
        { id: 'id3' },
      ]));

      const result = await service.gameIds(new Date(), new Date());

      expect(result).toEqual(['id1', 'id2', 'id3']);
    });
  });

  describe('players', () => {
    it('should return empty list if list is empty', async () => {
      jest.spyOn(playerRepositoryMock, 'find').mockReturnValue(Promise.resolve([]));

      const result = await service.players(true);

      expect(result).toEqual([]);
    });

    it('should return list of ids', async () => {
      jest.spyOn(playerRepositoryMock, 'find').mockReturnValue(Promise.resolve([
        { id: 'id1', name: 'some player name 1' },
        { id: 'id2', name: 'some player name 2' },
        { id: 'id3', name: 'some player name 3' },
      ]));

      const result = await service.players(true);

      expect(result).toEqual([
        { id: 'id1', name: 'some player name 1' },
        { id: 'id2', name: 'some player name 2' },
        { id: 'id3', name: 'some player name 3' },
      ]);
    });
  });

  describe('playerIds', () => {
    it('should return empty list if list is empty', async () => {
      jest.spyOn(service, 'players').mockResolvedValue([]);

      const result = await service.playerIds(true);

      expect(result).toEqual([]);
    });

    it('should return list of ids', async () => {
      jest.spyOn(service, 'players').mockResolvedValue([
        { id: 'id1', name: 'some player name 1' },
        { id: 'id2', name: 'some player name 2' },
        { id: 'id3', name: 'some player name 3' },
      ]);

      const result = await service.playerIds(true);

      expect(result).toEqual(['id1', 'id2', 'id3']);
    });
  });

  describe('roundIds', () => {
    it('should return empty list if list is empty', async () => {
      jest.spyOn(roundRepositoryMock, 'find').mockReturnValue(Promise.resolve([]));

      const result = await service.roundIds([]);

      expect(result).toEqual([]);
    });

    it('should return list of ids', async () => {
      jest.spyOn(roundRepositoryMock, 'find').mockReturnValue(Promise.resolve([
        { id: 'id1' },
        { id: 'id2' },
        { id: 'id3' },
      ]));

      const result = await service.roundIds([]);

      expect(result).toEqual(['id1', 'id2', 'id3']);
    });
  });

  describe('gamesWithRoundsAndEvents', () => {
    it('should return empty list if list is empty', async () => {
      jest.spyOn(gameRepositoryMock, 'find').mockReturnValue(Promise.resolve([]));

      const result = await service.gamesWithRoundsAndEvents([], []);

      expect(result).toEqual([]);
    });

    it('should return list of games with its rounds and events', async () => {
      jest.spyOn(gameRepositoryMock, 'find').mockReturnValue(Promise.resolve([
        { id: 'id1', datetime: new Date(), rounds: [], events: [{ id: 'eventId1', player: { id: 'playerId1' } }, { id: 'eventId2', player: { id: 'playerId2' } }] },
        { id: 'id2', datetime: new Date(), rounds: [{ id: 'roundId1', events: [{ id: 'eventId3', player: { id: 'playerId1' } }] }], events: [] },
        { id: 'id3', datetime: new Date(), rounds: [{ id: 'roundId2', events: [{ id: 'eventId4', player: { id: 'playerId2' } }] }], events: [] },
      ]));

      const result = await service.gamesWithRoundsAndEvents([], ['playerId1', 'playerId2']);

      expect(result.length).toBe(3);
      expect(result[0].rounds.length).toBe(0);
      expect(result[0].events.length).toBe(2);
      expect(result[1].rounds.length).toBe(1);
      expect(result[1].rounds[0].events.length).toBe(1);
      expect(result[2].rounds.length).toBe(1);
      expect(result[2].rounds[0].events.length).toBe(1);
    });

    it('should return list of games with its rounds and events, filtered by playerIds', async () => {
      jest.spyOn(gameRepositoryMock, 'find').mockReturnValue(Promise.resolve([
        { id: 'id1', datetime: new Date(), rounds: [], events: [{ id: 'eventId1', player: { id: 'playerId1' } }, { id: 'eventId2', player: { id: 'playerId2' } }] },
        { id: 'id2', datetime: new Date(), rounds: [{ id: 'roundId1', events: [{ id: 'eventId3', player: { id: 'playerId1' } }] }], events: [] },
        { id: 'id3', datetime: new Date(), rounds: [{ id: 'roundId2', events: [{ id: 'eventId4', player: { id: 'playerId2' } }] }], events: [] },
      ]));

      const result = await service.gamesWithRoundsAndEvents([], ['playerId1']);

      expect(result.length).toBe(3);
      expect(result[0].rounds.length).toBe(0);
      expect(result[0].events.length).toBe(1);
      expect(result[1].rounds.length).toBe(1);
      expect(result[1].rounds[0].events.length).toBe(1);
      expect(result[2].rounds.length).toBe(1);
      expect(result[2].rounds[0].events.length).toBe(0);
    });
  });

  describe('attendancesByPlayerId', () => {
    it('should return empty list if list of gameIds is empty', async () => {
      jest.spyOn(service, 'roundIds').mockResolvedValue(['id1']);
      jest.spyOn(dataSourceMock, 'query').mockImplementation(() => [
        { playerId: 'id1', count: '42' },
        { playerId: 'id2', count: '12' },
        { playerId: 'id3', count: '99' },
      ]);

      const result = await service.attendancesByPlayerId([], []);

      expect(result).toStrictEqual([]);
    });

    it('should return empty list if list of roundIds is empty', async () => {
      jest.spyOn(service, 'roundIds').mockResolvedValue([]);
      jest.spyOn(dataSourceMock, 'query').mockImplementation(() => [
        { playerId: 'id1', count: '42' },
        { playerId: 'id2', count: '12' },
        { playerId: 'id3', count: '99' },
      ]);

      const result = await service.attendancesByPlayerId(['id1'], []);

      expect(result).toStrictEqual([]);
    });

    it('should return list of attendances', async () => {
      jest.spyOn(service, 'roundIds').mockResolvedValue(['id1']);
      jest.spyOn(dataSourceMock, 'query').mockImplementation(() => [
        { playerId: 'id1', count: '42' },
        { playerId: 'id2', count: '12' },
        { playerId: 'id3', count: '99' },
      ]);

      const result = await service.attendancesByPlayerId(['id1'], []);

      expect(result).toStrictEqual([
        { playerId: 'id1', count: '42' },
        { playerId: 'id2', count: '12' },
        { playerId: 'id3', count: '99' },
      ]);
    });
  });

  describe('gamesWithPenalties', () => {
    it('should return empty list if list is empty', async () => {
      jest.spyOn(service, 'gamesWithRoundsAndEvents').mockResolvedValue([]);

      const result = await service.gamesWithPenalties([], []);

      expect(result).toEqual([]);
    });

    it('should return list of games with its penalties', async () => {
      jest.spyOn(service, 'gamesWithRoundsAndEvents').mockResolvedValue([
        { id: 'id1', datetime: new Date(), rounds: [], events: [createEvent(PenaltyUnit.EURO, 0.5, 3), createEvent(PenaltyUnit.BEER_CRATE, 1, 1)] },
        {
          id: 'id2',
          datetime: new Date(),
          rounds: [
            {
              id: 'roundId1',
              events: [
                createEvent(PenaltyUnit.EURO, 1, 1),
                createEvent(PenaltyUnit.EURO, 1.5, 3),
                createEvent(PenaltyUnit.BEER_CRATE, 1, 1),
              ]
            } as Round,
            {
              id: 'roundId2',
              events: [
                createEvent(PenaltyUnit.EURO, 0.75, 1),
                createEvent(PenaltyUnit.BEER_CRATE, 2, 1),
              ]
            } as Round
          ],
          events: [
            createEvent(PenaltyUnit.EURO, 3, 3),
          ]
        },
      ]);

      const result = await service.gamesWithPenalties([], []);

      expect(result.length).toBe(2);

      // Game 1
      expect(result[0].roundPenalties).toStrictEqual([]);
      expect(result[0].gamePenalties.length).toBe(2);
      expect(result[0].gamePenalties[0]).toStrictEqual({ unit: PenaltyUnit.EURO, sum: 1.5 });
      expect(result[0].gamePenalties[1]).toStrictEqual({ unit: PenaltyUnit.BEER_CRATE, sum: 1 });
      expect(result[0].combinedPenalties.length).toBe(2);
      expect(result[0].combinedPenalties[0]).toStrictEqual({ unit: PenaltyUnit.EURO, sum: 1.5 });
      expect(result[0].combinedPenalties[1]).toStrictEqual({ unit: PenaltyUnit.BEER_CRATE, sum: 1 });
      expect(result[0].roundAverage).toBe(0);

      // Game 2
      expect(result[1].roundPenalties.length).toBe(2);
      expect(result[1].roundPenalties[0]).toStrictEqual({ unit: PenaltyUnit.EURO, sum: 6.25 });
      expect(result[1].roundPenalties[1]).toStrictEqual({ unit: PenaltyUnit.BEER_CRATE, sum: 3 });
      expect(result[1].gamePenalties.length).toBe(1);
      expect(result[1].gamePenalties[0]).toStrictEqual({ unit: PenaltyUnit.EURO, sum: 9 });
      expect(result[1].combinedPenalties.length).toBe(2);
      expect(result[1].combinedPenalties[0]).toStrictEqual({ unit: PenaltyUnit.EURO, sum: 15.25 });
      expect(result[1].combinedPenalties[1]).toStrictEqual({ unit: PenaltyUnit.BEER_CRATE, sum: 3 });
      expect(result[1].roundAverage).toBe(3.125);
    });
  });

  describe('roundsWithPenalties', () => {
    it('should return empty list if list is empty', async () => {
      jest.spyOn(service, 'gamesWithRoundsAndEvents').mockResolvedValue([]);

      const result = await service.roundsWithPenalties([], []);

      expect(result).toEqual([]);
    });

    it('should return list of rounds with its penalties', async () => {
      jest.spyOn(service, 'gamesWithRoundsAndEvents').mockResolvedValue([
        { id: 'id1', datetime: new Date(), rounds: [], events: [createEvent(PenaltyUnit.EURO, 0.5, 3), createEvent(PenaltyUnit.BEER_CRATE, 1, 1)] },
        {
          id: 'id2',
          datetime: new Date(),
          rounds: [
            {
              id: 'roundId1',
              events: [
                createEvent(PenaltyUnit.EURO, 1, 1),
                createEvent(PenaltyUnit.EURO, 1.5, 3),
                createEvent(PenaltyUnit.BEER_CRATE, 1, 1),
              ]
            } as Round,
            {
              id: 'roundId2',
              events: [
                createEvent(PenaltyUnit.EURO, 0.75, 1),
                createEvent(PenaltyUnit.BEER_CRATE, 2, 1),
              ]
            } as Round
          ],
          events: [
            createEvent(PenaltyUnit.EURO, 3, 3),
          ]
        },
      ]);

      const result = await service.roundsWithPenalties([], []);

      expect(result.length).toBe(2);
      expect(result[0].sum).toBe(5.5);
      expect(result[1].sum).toBe(0.75);
    });
  });

  describe('penaltySum', () => {
    it('should summarize penalties when lists are empty', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'gamesWithPenalties').mockResolvedValue([]);

      const result = await service.penaltySum(mockConfig);

      expect(result).toEqual([]);
    });

    it('should summarize penalties', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'gamesWithPenalties').mockResolvedValue([
        { combinedPenalties: [{ unit: PenaltyUnit.EURO, sum: 4.3 }] },
        { combinedPenalties: [{ unit: PenaltyUnit.EURO, sum: 2.7 }] },
      ] as { id: string; datetime: Date; gamePenalties: PenaltyDto[]; roundPenalties: PenaltyDto[]; combinedPenalties: PenaltyDto[]; roundAverage: number; }[]);

      const result = await service.penaltySum(mockConfig);

      expect(result).toEqual([
        { unit: PenaltyUnit.EURO, sum: 7 },
        { unit: PenaltyUnit.BEER_CRATE, sum: 0 },
      ]);
    });
  });

  describe('countRounds', () => {
    it('should count rounds when list is empty', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundIds').mockResolvedValue([]);

      const result = await service.countRounds(mockConfig);

      expect(result).toBe(0);
    });

    it('should count rounds', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundIds').mockResolvedValue(['id1', 'id2', 'id3']);

      const result = await service.countRounds(mockConfig);

      expect(result).toBe(3);
    });
  });

  describe('attendancesTable', () => {
    it('should return attendances when list is empty', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'players').mockResolvedValue([]);
      jest.spyOn(service, 'countRounds').mockResolvedValue(0);
      jest.spyOn(service, 'attendancesByPlayerId').mockResolvedValue([]);

      const result = await service.attendancesTable(mockConfig);

      expect(result).toEqual([]);
    });

    it('should return attendances', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'players').mockResolvedValue([
        { id: 'id1', name: 'Player1' }
      ]);
      jest.spyOn(service, 'countRounds').mockResolvedValue(100);
      jest.spyOn(service, 'attendancesByPlayerId').mockResolvedValue([
        { playerId: 'id1', count: '50' },
        { playerId: 'id2', count: '20' },
      ]);

      const result = await service.attendancesTable(mockConfig);

      expect(result).toEqual([
        { id: 'id1', name: 'Player1', count: 50, quote: 0.5 },
        { id: 'id2', name: undefined, count: 20, quote: 0.2 },
      ]);
    });
  });

  describe('hostsTable', () => {
    it('should return hosts when list is empty', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundIds').mockResolvedValue([]);
      jest.spyOn(service, 'players').mockResolvedValue([]);
      jest.spyOn(gameRepositoryMock, 'createQueryBuilder').mockImplementation(() => queryBuilderMock([]));

      const result = await service.hostsTable(mockConfig);

      expect(result).toEqual([]);
    });

    it('should return hosts', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundIds').mockResolvedValue([]);
      jest.spyOn(service, 'players').mockResolvedValue([
        { id: 'id1', name: 'Player1' }
      ]);
      jest.spyOn(gameRepositoryMock, 'createQueryBuilder').mockImplementation(() => queryBuilderMock([
        { count: 20, hostedById: 'id1', placeType: PlaceType.HOME },
        { count: 5, hostedById: null, placeType: PlaceType.AWAY },
        { count: 10, hostedById: 'id2', placeType: PlaceType.HOME },
        { count: 9, hostedById: null, placeType: PlaceType.REMOTE },
      ]));

      const result = await service.hostsTable(mockConfig);

      expect(result).toEqual([
        { count: 20, hostedById: 'id1', name: 'Player1', placeType: PlaceType.HOME },
        { count: 5, hostedById: null, placeType: PlaceType.AWAY },
        { count: 10, hostedById: 'id2', name: undefined, placeType: PlaceType.HOME },
        { count: 9, hostedById: null, placeType: PlaceType.REMOTE }
      ]);
    });
  });

  describe('averageRoundsPerGame', () => {
    it('should calculate average when list is empty', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundIds').mockResolvedValue([]);

      const result = await service.averageRoundsPerGame(mockConfig);

      expect(result).toBeUndefined();
    });

    it('should calculate average', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue(['id1', 'id2', 'id3', 'id4']);
      jest.spyOn(service, 'roundIds').mockResolvedValue(['id1', 'id2', 'id3', 'id4', 'id5', 'id6', 'id7']);

      const result = await service.averageRoundsPerGame(mockConfig);

      expect(result).toBe(1.75);
    });
  });

  describe('countGames', () => {
    it('should count games when list is empty', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);

      const result = await service.countGames(mockConfig);

      expect(result).toBe(0);
    });

    it('should count games', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue(['id1', 'id2', 'id3']);

      const result = await service.countGames(mockConfig);

      expect(result).toBe(3);
    });
  });

  describe('euroPerGame', () => {
    it('should return undefined when no data given', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'penaltySum').mockResolvedValue([]);

      const result = await service.euroPerGame(mockConfig);

      expect(result).toBeUndefined();
    });

    it('should calculate euro per game', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue(['id1', 'id2', 'id3', 'id4', 'id5']);
      jest.spyOn(service, 'penaltySum').mockResolvedValue([
        { unit: PenaltyUnit.EURO, sum: 1235.50 },
        { unit: PenaltyUnit.BEER_CRATE, sum: 10 },
      ]);

      const result = await service.euroPerGame(mockConfig);

      expect(result).toBe(247.1);
    });
  });

  describe('euroPerRound', () => {
    it('should return undefined when no data given', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundsWithPenalties').mockResolvedValue([]);

      const result = await service.euroPerRound(mockConfig);

      expect(result).toBeUndefined();
    });

    it('should calculate euro per round', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundIds').mockResolvedValue(['id1', 'id2', 'id3', 'id4']);
      jest.spyOn(service, 'roundsWithPenalties').mockResolvedValue([
        { id: 'id1', sum: 5.50 }, { id: 'id2', sum: 1.75 }, { id: 'id3', sum: 2.75 }, { id: 'id4', sum: 8.28 }
      ]);

      const result = await service.euroPerRound(mockConfig);

      expect(result).toBe(4.57);
    });
  });

  describe('mostExpensiveGame', () => {
    it('should return undefined when no data given', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'gamesWithPenalties').mockResolvedValue([]);

      const result = await service.mostExpensiveGame(mockConfig);

      expect(result).toBeUndefined();
    });

    it('should find max sum', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'gamesWithPenalties').mockResolvedValue([
        { id: 'id1', datetime: new Date(), combinedPenalties: [{ unit: PenaltyUnit.EURO, sum: 89.50 }, { unit: PenaltyUnit.BEER_CRATE, sum: 1 }], roundPenalties: [], gamePenalties: [], roundAverage: 1 },
        { id: 'id2', datetime: new Date(), combinedPenalties: [{ unit: PenaltyUnit.EURO, sum: 140.75 }], roundPenalties: [], gamePenalties: [], roundAverage: 1 },
        { id: 'id3', datetime: new Date(), combinedPenalties: [{ unit: PenaltyUnit.EURO, sum: 140.75 }], roundPenalties: [], gamePenalties: [], roundAverage: 1 },
        { id: 'id4', datetime: new Date(), combinedPenalties: [{ unit: PenaltyUnit.EURO, sum: 50.75 }], roundPenalties: [], gamePenalties: [], roundAverage: 1 },
        { id: 'id5', datetime: new Date(), combinedPenalties: [{ unit: PenaltyUnit.BEER_CRATE, sum: 150 }], roundPenalties: [], gamePenalties: [], roundAverage: 1 },
      ]);

      const result = await service.mostExpensiveGame(mockConfig);

      expect(result.id).toBe('id2');
      expect(result.sum).toBe(140.75);
    });
  });

  describe('mostExpensiveRoundAveragePerGame', () => {
    it('should return undefined when no data given', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'gamesWithPenalties').mockResolvedValue([]);

      const result = await service.mostExpensiveRoundAveragePerGame(mockConfig);

      expect(result).toBeUndefined();
    });

    it('should find max roundAverage', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'gamesWithPenalties').mockResolvedValue([
        { id: 'id1', datetime: new Date(), combinedPenalties: [], roundPenalties: [], gamePenalties: [], roundAverage: 3.41 },
        { id: 'id2', datetime: new Date(), combinedPenalties: [], roundPenalties: [], gamePenalties: [], roundAverage: 4.41 },
        { id: 'id3', datetime: new Date(), combinedPenalties: [], roundPenalties: [], gamePenalties: [], roundAverage: 4.41 },
        { id: 'id4', datetime: new Date(), combinedPenalties: [], roundPenalties: [], gamePenalties: [], roundAverage: 2.41 },
      ]);

      const result = await service.mostExpensiveRoundAveragePerGame(mockConfig);

      expect(result.id).toBe('id2');
      expect(result.roundAverage).toBe(4.41);
    });
  });

  describe('mostExpensiveRound', () => {
    it('should return undefined when no data given', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundsWithPenalties').mockResolvedValue([]);

      const result = await service.mostExpensiveRound(mockConfig);

      expect(result).toBeUndefined();
    });

    it('should find max sum', async () => {
      jest.spyOn(service, 'gameIds').mockResolvedValue([]);
      jest.spyOn(service, 'playerIds').mockResolvedValue([]);
      jest.spyOn(service, 'roundsWithPenalties').mockResolvedValue([{ id: 'id1', sum: 42.55 }, { id: 'id2', sum: 55.99 }, { id: 'id3', sum: 12.00 }, { id: 'id4', sum: 55.99 }]);

      const result = await service.mostExpensiveRound(mockConfig);

      expect(result.id).toBe('id2');
      expect(result.sum).toBe(55.99);
    });
  });
});
