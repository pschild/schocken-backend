import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { PlaceType } from '../../src/game/dto/place.dto';
import { GameService } from '../../src/game/game.service';
import { Player } from '../../src/model/player.entity';
import { Round } from '../../src/model/round.entity';
import { Game } from '../../src/model/game.entity';
import { PlayerService } from '../../src/player/player.service';
import { RoundService } from '../../src/round/round.service';
import { RANDOM_STRING, RANDOM_UUID, setupDataSource, truncateAllTables, UUID_V4_REGEX } from '../../src/test.utils';

describe('Games', () => {
  let gameService: GameService;
  let roundService: RoundService;
  let playerService: PlayerService;
  let source: DataSource;
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
        PlayerService,
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
    playerService = moduleRef.get(PlayerService);
    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  describe('should be created', () => {
    it('without place', async () => {
      const result = await firstValueFrom(gameService.create({}));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(100);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(100);
      expect(differenceInMilliseconds(new Date(), new Date(result.datetime))).toBeLessThan(100);
      expect(result.completed).toBe(false);
      expect(result.place).toBeNull();
    });

    it('with away place', async () => {
      const result = await firstValueFrom(gameService.create({ placeOfAwayGame: 'anywhere' }));
      expect(result.place).toEqual({ type: PlaceType.AWAY, name: 'anywhere' });
    });

    it('with home place', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({name: 'John'}));
      const result = await firstValueFrom(gameService.create({ hostedById: createdPlayer.id }));
      expect(result.place).toEqual({ type: PlaceType.HOME, name: 'John' });
    });
  });

  describe('should not be created', () => {
    it('with too long place name', async () => {
      await expect(firstValueFrom(gameService.create({ placeOfAwayGame: RANDOM_STRING(65) }))).rejects.toThrowError(/value too long for type character/);
    });

    it('with unknown player given', async () => {
      await expect(firstValueFrom(gameService.create({ hostedById: RANDOM_UUID }))).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('with both hostedById and placeOfAwayGame given', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({name: 'John'}));
      await expect(firstValueFrom(gameService.create({ hostedById: createdPlayer.id, placeOfAwayGame: 'anywhere' }))).rejects.toThrowError(/check constraint .+ is violated by some row/);
    });
  });

  it('should be updated', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ hostedById: createdPlayer.id }));
    const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    let result;
    result = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(result.rounds.length).toBe(2);
    expect(result.completed).toBe(false);
    expect(result.rounds[0].id).toEqual(createdRound1.id);
    expect(result.rounds[1].id).toEqual(createdRound2.id);
    expect(result.place).toEqual({ type: PlaceType.HOME, name: createdPlayer.name });

    await firstValueFrom(gameService.update(createdGame.id, { completed: true }));

    result = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(result.rounds.length).toBe(2);
    expect(result.completed).toBe(true);
    expect(result.rounds[0].id).toEqual(createdRound1.id);
    expect(result.rounds[1].id).toEqual(createdRound2.id);
    expect(result.place).toEqual({ type: PlaceType.HOME, name: createdPlayer.name });
  });

  it('should be removed including all referring rounds', async () => {
    const createdGame = await firstValueFrom(gameService.create({}));
    const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    const result = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(result.rounds.length).toBe(2);
    expect(result.rounds[0].id).toEqual(createdRound1.id);
    expect(result.rounds[1].id).toEqual(createdRound2.id);

    await firstValueFrom(gameService.remove(createdGame.id));

    await expect(firstValueFrom(gameService.findAll())).resolves.toEqual([]);
    await expect(firstValueFrom(roundService.findAll())).resolves.toEqual([]);
  });

  it('should be removed when related to a player', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ hostedById: createdPlayer.id }));

    const result = await firstValueFrom(roundService.remove(createdGame.id));
    expect(result).toEqual(createdGame.id);

    // player should still exist
    const player = await firstValueFrom(playerService.findOne(createdPlayer.id));
    expect(player).toBeDefined();
  });

  it('should set place to null if player was deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ hostedById: createdPlayer.id }));

    const result = await playerRepo.delete(createdPlayer.id);
    expect(result.affected).toEqual(1);

    const game = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(game.place).toBeNull();
  });

  it('should load place even if player was softly deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ hostedById: createdPlayer.id }));

    const result = await firstValueFrom(playerService.remove(createdPlayer.id));
    expect(result).toEqual(createdPlayer.id);

    const game = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(game.place).toEqual({ type: PlaceType.HOME, name: 'John' });
  });
});
