import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { setupDataSource, truncateAllTables } from '../../src/database/setup-test-data-source';
import { GameService } from '../../src/game/game.service';
import { Round } from '../../src/model/round.entity';
import { Game } from '../../src/model/game.entity';
import { RoundService } from '../../src/round/round.service';
import { RANDOM_UUID, UUID_V4_REGEX } from '../../src/test.utils';

describe('Game and rounds integration', () => {
  let gameService: GameService;
  let roundService: RoundService;
  let source: DataSource;
  let gameRepo: Repository<Game>;
  let roundRepo: Repository<Round>;

  beforeAll(async () => {
    source = await setupDataSource([Game, Round]);

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
        }
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

  describe('game', () => {
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

      const result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.completed).toBe(false);
      expect(result.rounds[0].id).toEqual(createdRound1.id);
      expect(result.rounds[1].id).toEqual(createdRound2.id);

      await firstValueFrom(gameService.update(createdGame.id, { completed: true }));

      const resultAfterUpdate = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(resultAfterUpdate.rounds.length).toBe(2);
      expect(resultAfterUpdate.completed).toBe(true);
      expect(resultAfterUpdate.rounds[0].id).toEqual(createdRound1.id);
      expect(resultAfterUpdate.rounds[1].id).toEqual(createdRound2.id);
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

  describe('round', () => {
    it('should be created with an existing gameId', async () => {
      const createdGame = await gameRepo.save({});

      const result = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(result.gameId).toEqual(createdGame.id);
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(100);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(100);
      expect(differenceInMilliseconds(new Date(), new Date(result.datetime))).toBeLessThan(100);
    });

    it('should not be created with an unknown gameId', async () => {
      await expect(firstValueFrom(roundService.create({gameId: RANDOM_UUID}))).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('should be updated', async () => {
      const createdGame = await gameRepo.save({});
      const createdRound1 = await roundRepo.save({ gameId: createdGame.id });
      const createdRound2 = await roundRepo.save({ gameId: createdGame.id });

      const result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.rounds[0].id).toEqual(createdRound1.id);
      expect(result.rounds[1].id).toEqual(createdRound2.id);

      await firstValueFrom(roundService.update(createdRound2.id, { datetime: new Date().toISOString() }));

      const resultAfterUpdate = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(resultAfterUpdate.rounds.length).toBe(2);
      expect(resultAfterUpdate.rounds[0].id).toEqual(createdRound1.id);
      expect(resultAfterUpdate.rounds[1].id).toEqual(createdRound2.id);
    });

    it('should be queried including its game', async () => {
      const createdGame = await gameRepo.save({});
      const createdRound = await roundRepo.save({ gameId: createdGame.id });

      const result = await firstValueFrom(roundService.findOne(createdRound.id));
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(result.gameId).toEqual(createdGame.id);
      expect(result.game.id).toEqual(createdGame.id);
      expect(result.game.datetime).toEqual(createdGame.datetime.toISOString());
      expect(result.game.completed).toEqual(createdGame.completed);
    });

    it('should be removed', async () => {
      const createdGame = await gameRepo.save({});
      await roundRepo.save({ gameId: createdGame.id });
      const createdRound2 = await roundRepo.save({ gameId: createdGame.id });

      const result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);

      await firstValueFrom(roundService.remove(createdRound2.id));

      const resultAfterRemoval = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(resultAfterRemoval.rounds.length).toBe(1);
    });
  });
});
