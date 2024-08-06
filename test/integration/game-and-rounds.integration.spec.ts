import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { setupDataSource, truncateAllTables } from '../../src/database/setup-test-data-source';
import { GameService } from '../../src/game/game.service';
import { Player } from '../../src/model/player.entity';
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
  let playerRepo: Repository<Player>;

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
        {
          provide: getRepositoryToken(Player),
          useValue: source.getRepository(Player),
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
    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
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

      let result;
      result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.rounds[0].id).toEqual(createdRound1.id);
      expect(result.rounds[1].id).toEqual(createdRound2.id);

      await firstValueFrom(roundService.update(createdRound2.id, { datetime: new Date().toISOString() }));

      result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.rounds[0].id).toEqual(createdRound1.id);
      expect(result.rounds[1].id).toEqual(createdRound2.id);
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

      let result;
      result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);

      await firstValueFrom(roundService.remove(createdRound2.id));

      result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(1);
    });
  });

  describe('attendances', () => {
    it('should be empty when not specified', async () => {
      const createdGame = await gameRepo.save({});

      const result = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      expect(result).toBeTruthy();
      expect(result.attendees).toEqual([]);
    });

    it('should be added and removed for an existing round', async () => {
      const createdPlayer1 = await playerRepo.save({ name: 'John' });
      const createdPlayer2 = await playerRepo.save({ name: 'Jake' });
      const createdGame = await gameRepo.save({});
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      await firstValueFrom(roundService.addAttendance(createdRound.id, createdPlayer1.id));

      let result;
      result = await firstValueFrom(roundService.addAttendance(createdRound.id, createdPlayer2.id));
      expect(result.attendees.length).toBe(2);
      expect(result.attendees[0].id).toEqual(createdPlayer1.id);
      expect(result.attendees[1].id).toEqual(createdPlayer2.id);

      result = await firstValueFrom(roundService.removeAttendance(createdRound.id, createdPlayer1.id));
      expect(result.attendees.length).toBe(1);
      expect(result.attendees[0].id).toEqual(createdPlayer2.id);
    });

    it('should not be updated with an unknown playerId', async () => {
      const createdGame = await gameRepo.save({});
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      await expect(firstValueFrom(roundService.addAttendance(createdRound.id, RANDOM_UUID))).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('should not remove player when round is removed', async () => {
      const createdPlayer = await playerRepo.save({ name: 'John' });
      const createdGame = await gameRepo.save({});
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      await firstValueFrom(roundService.addAttendance(createdRound.id, createdPlayer.id));

      await firstValueFrom(roundService.remove(createdRound.id));

      const result = await playerRepo.findOne({ where: { id: createdPlayer.id } });
      expect(result).toBeDefined();
    });

    it('should not remove attendance if player is (softly) deleted', async () => {
      const createdPlayer = await playerRepo.save({ name: 'John' });
      const createdGame = await gameRepo.save({});
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      await firstValueFrom(roundService.addAttendance(createdRound.id, createdPlayer.id));

      let result;
      result = await firstValueFrom(roundService.findOne(createdRound.id));
      expect(result.attendees.length).toBe(1);

      let queryResult;
      queryResult = await source.manager.query(`SELECT * FROM attendances`);
      expect(queryResult).toEqual([{
        roundId: createdRound.id,
        playerId: createdPlayer.id,
      }]);

      await playerRepo.softDelete(createdPlayer.id);

      result = await firstValueFrom(roundService.findOne(createdRound.id));
      expect(result.attendees.length).toBe(0);

      queryResult = await source.manager.query(`SELECT * FROM attendances`);
      expect(queryResult).toEqual([{
        roundId: createdRound.id,
        playerId: createdPlayer.id,
      }]);
    });
  });
});
