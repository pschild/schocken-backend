import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { GameService } from '../../src/game/game.service';
import { Player } from '../../src/model/player.entity';
import { Round } from '../../src/model/round.entity';
import { Game } from '../../src/model/game.entity';
import { RoundService } from '../../src/round/round.service';
import { RANDOM_UUID, setupDataSource, truncateAllTables } from '../../src/test.utils';

describe('Finalists', () => {
  let roundService: RoundService;
  let source: DataSource;
  let gameRepo: Repository<Game>;
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

    roundService = moduleRef.get(RoundService);
    gameRepo = moduleRef.get<Repository<Game>>(getRepositoryToken(Game));
    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  it('should be empty when not specified', async () => {
    const createdGame = await gameRepo.save({});

    const result = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    expect(result).toBeTruthy();
    expect(result.finalists).toEqual([]);
  });

  it('should be added and removed for an existing round', async () => {
    const createdPlayer1 = await playerRepo.save({ name: 'John' });
    const createdPlayer2 = await playerRepo.save({ name: 'Jake' });
    const createdGame = await gameRepo.save({});
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    await firstValueFrom(roundService.addFinalist(createdRound.id, createdPlayer1.id));

    let result;
    result = await firstValueFrom(roundService.addFinalist(createdRound.id, createdPlayer2.id));
    expect(result.finalists.length).toBe(2);
    expect(result.finalists[0].id).toEqual(createdPlayer1.id);
    expect(result.finalists[1].id).toEqual(createdPlayer2.id);

    result = await firstValueFrom(roundService.removeFinalist(createdRound.id, createdPlayer1.id));
    expect(result.finalists.length).toBe(1);
    expect(result.finalists[0].id).toEqual(createdPlayer2.id);
  });

  it('should not be updated with an unknown playerId', async () => {
    const createdGame = await gameRepo.save({});
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    await expect(firstValueFrom(roundService.addFinalist(createdRound.id, RANDOM_UUID))).rejects.toThrowError(/violates foreign key constraint/);
  });

  it('should not remove player when round is removed', async () => {
    const createdPlayer = await playerRepo.save({ name: 'John' });
    const createdGame = await gameRepo.save({});
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.addFinalist(createdRound.id, createdPlayer.id));

    await firstValueFrom(roundService.remove(createdRound.id));

    const result = await playerRepo.findOne({ where: { id: createdPlayer.id } });
    expect(result).toBeDefined();
  });

  it('should remove finalist if round is deleted', async () => {
    const createdPlayer = await playerRepo.save({ name: 'John' });
    const createdGame = await gameRepo.save({});
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.addFinalist(createdRound.id, createdPlayer.id));

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.id,
      playerId: createdPlayer.id,
    }]);

    await firstValueFrom(roundService.remove(createdRound.id));

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([]);
  });

  it('should remove finalist if player is deleted', async () => {
    const createdPlayer = await playerRepo.save({ name: 'John' });
    const createdGame = await gameRepo.save({});
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.addFinalist(createdRound.id, createdPlayer.id));

    let result;
    result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.finalists.length).toBe(1);

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.id,
      playerId: createdPlayer.id,
    }]);

    await playerRepo.delete(createdPlayer.id);

    result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.finalists.length).toBe(0);

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([]);
  });

  it('should not remove finalist if player is softly deleted', async () => {
    const createdPlayer = await playerRepo.save({ name: 'John' });
    const createdGame = await gameRepo.save({});
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.addFinalist(createdRound.id, createdPlayer.id));

    let result;
    result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.finalists.length).toBe(1);

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.id,
      playerId: createdPlayer.id,
    }]);

    await playerRepo.softDelete(createdPlayer.id);

    result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.finalists.length).toBe(0);

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.id,
      playerId: createdPlayer.id,
    }]);
  });
});
