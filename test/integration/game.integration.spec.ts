import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { GameService } from '../../src/game/game.service';
import { Player } from '../../src/model/player.entity';
import { Round } from '../../src/model/round.entity';
import { Game } from '../../src/model/game.entity';
import { RoundService } from '../../src/round/round.service';
import { setupDataSource, truncateAllTables, UUID_V4_REGEX } from '../../src/test.utils';

describe('Games', () => {
  let gameService: GameService;
  let roundService: RoundService;
  let source: DataSource;
  let gameRepo: Repository<Game>;
  let roundRepo: Repository<Round>;

  beforeAll(async () => {
    source = await setupDataSource([Game, Round, Player]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        GameService,
        RoundService,
        {
          provide: getRepositoryToken(Game),
          useValue: source.getRepository(Game),
        },
        {
          provide: getRepositoryToken(Round),
          useValue: source.getRepository(Round),
        },
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    gameService = moduleRef.get(GameService);
    roundService = moduleRef.get(RoundService);
    gameRepo = moduleRef.get<Repository<Game>>(getRepositoryToken(Game));
    roundRepo = moduleRef.get<Repository<Round>>(getRepositoryToken(Round));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  it('should be created', async () => {
    const result = await firstValueFrom(gameService.create({}));
    expect(result).toBeTruthy();
    expect(result.id).toMatch(UUID_V4_REGEX);
    expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(100);
    expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(100);
    expect(differenceInMilliseconds(new Date(), new Date(result.datetime))).toBeLessThan(100);
    expect(result.completed).toBe(false);
  });

  it('should be updated', async () => {
    const createdGame = await gameRepo.save({});
    const createdRound1 = await roundRepo.save({ gameId: createdGame.id });
    const createdRound2 = await roundRepo.save({ gameId: createdGame.id });

    let result;
    result = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(result.rounds.length).toBe(2);
    expect(result.completed).toBe(false);
    expect(result.rounds[0].id).toEqual(createdRound1.id);
    expect(result.rounds[1].id).toEqual(createdRound2.id);

    await firstValueFrom(gameService.update(createdGame.id, { completed: true }));

    result = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(result.rounds.length).toBe(2);
    expect(result.completed).toBe(true);
    expect(result.rounds[0].id).toEqual(createdRound1.id);
    expect(result.rounds[1].id).toEqual(createdRound2.id);
  });

  it('should be removed including all referring rounds', async () => {
    const createdGame = await gameRepo.save({});
    const createdRound1 = await roundRepo.save({ gameId: createdGame.id });
    const createdRound2 = await roundRepo.save({ gameId: createdGame.id });

    const result = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(result.rounds.length).toBe(2);
    expect(result.rounds[0].id).toEqual(createdRound1.id);
    expect(result.rounds[1].id).toEqual(createdRound2.id);

    await firstValueFrom(gameService.remove(createdGame.id));

    await expect(firstValueFrom(gameService.findAll())).resolves.toEqual([]);
    await expect(firstValueFrom(roundService.findAll())).resolves.toEqual([]);
  });
});
