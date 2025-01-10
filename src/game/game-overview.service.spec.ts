import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Game } from '../model/game.entity';
import { MockType, TestData } from '../test.utils';
import { GameOverviewService } from './game-overview.service';

describe('GameOverviewService', () => {
  let service: GameOverviewService;
  let repositoryMock: MockType<Repository<Game>>;

  const repositoryMockFactory: () => MockType<Repository<Game>> = jest.fn(() => ({
    find: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameOverviewService,
        { provide: getRepositoryToken(Game), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(GameOverviewService);
    repositoryMock = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create overview list of games grouped and sorted by year', async () => {
    const game1 = { ...TestData.game(), datetime: new Date('2024-11-26T12:34:56') };
    const game2 = { ...TestData.game(), datetime: new Date('2023-11-26T12:34:56') };
    const game3 = { ...TestData.game(), datetime: new Date('2023-10-03T12:34:56') };
    const game4 = { ...TestData.game(), datetime: new Date('2023-08-03T12:34:56') };
    const game5 = { ...TestData.game(), datetime: new Date('2022-01-01T12:34:56') };
    const game6 = { ...TestData.game(), datetime: new Date('2020-01-01T12:34:56') };
    repositoryMock.find.mockReturnValue(Promise.resolve([game1, game2, game3, game4, game5, game6]));

    const result = await firstValueFrom(service.getOverview());
    expect(result.length).toBe(4);
    expect(result.map(entry => entry.year)).toEqual(['2024', '2023', '2022', '2020']);
    expect(result.map(entry => entry.games.length)).toEqual([1, 3, 1, 1]);
    expect(result.every(entry => entry.penaltySum.length === 0)).toBeTruthy();
    expect(result.every(entry => entry.games.every(game => game.rounds.length === 0))).toBeTruthy();

    expect(result.find(entry => entry.year === '2023').games[0].datetime.toISOString()).toMatch(/2023-11-/);
    expect(result.find(entry => entry.year === '2023').games[1].datetime.toISOString()).toMatch(/2023-10-/);
    expect(result.find(entry => entry.year === '2023').games[2].datetime.toISOString()).toMatch(/2023-08-/);

    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });
});
