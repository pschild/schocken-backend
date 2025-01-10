import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { PlaceType } from '../game/enum/place-type.enum';
import { GameDetailService } from '../game/game-detail.service';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PlayerService } from '../player/player.service';
import { getDockerDataSource, RANDOM_UUID, truncateAllTables } from '../test.utils';
import { RoundDetailService } from './round-detail.service';

describe('Finalists', () => {
  let gameDetailService: GameDetailService;
  let roundDetailService: RoundDetailService;
  let playerService: PlayerService;
  let source: DataSource;
  let playerRepo: Repository<Player>;

  beforeAll(async () => {
    source = await getDockerDataSource();

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        GameDetailService,
        RoundDetailService,
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

    gameDetailService = moduleRef.get(GameDetailService);
    roundDetailService = moduleRef.get(RoundDetailService);
    playerService = moduleRef.get(PlayerService);
    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  });

  it('should be empty when not specified', async () => {
    const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));

    const result = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
    expect(result.round).toBeTruthy();
    expect(result.round.finalists).toEqual([]);
  });

  it('should be updated for an existing round', async () => {
    const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'Jake' }));
    const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

    let result;
    result = await firstValueFrom(roundDetailService.updateFinalists(createdRound.round.id, { playerIds: [createdPlayer1.id, createdPlayer2.id] }));
    expect(result.finalists.length).toBe(2);
    expect(result.finalists[0].id).toEqual(createdPlayer1.id);
    expect(result.finalists[1].id).toEqual(createdPlayer2.id);

    result = await firstValueFrom(roundDetailService.updateFinalists(createdRound.round.id, { playerIds: [createdPlayer2.id] }));
    expect(result.finalists.length).toBe(1);
    expect(result.finalists[0].id).toEqual(createdPlayer2.id);
  });

  it('should not be updated with an unknown playerId', async () => {
    const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

    await expect(firstValueFrom(roundDetailService.updateFinalists(createdRound.round.id, { playerIds: [RANDOM_UUID()] }))).rejects.toThrowError(/violates foreign key constraint/);
  });

  it('should not remove player when round is removed', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundDetailService.updateFinalists(createdRound.round.id, { playerIds: [createdPlayer.id] }));

    await firstValueFrom(roundDetailService.remove(createdRound.round.id));

    const result = await firstValueFrom(playerService.findOne(createdPlayer.id));
    expect(result).toBeDefined();
  });

  it('should remove participation in final if round is deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundDetailService.updateFinalists(createdRound.round.id, { playerIds: [createdPlayer.id] }));

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.round.id,
      playerId: createdPlayer.id,
    }]);

    await firstValueFrom(roundDetailService.remove(createdRound.round.id));

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([]);
  });

  it('should remove participation in final if player is deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundDetailService.updateFinalists(createdRound.round.id, { playerIds: [createdPlayer.id] }));

    let result;
    result = await firstValueFrom(roundDetailService.findOne(createdRound.round.id));
    expect(result.finalists.length).toBe(1);
    expect(result.finalists[0].name).toEqual('John');

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.round.id,
      playerId: createdPlayer.id,
    }]);

    await playerRepo.delete(createdPlayer.id);

    result = await firstValueFrom(roundDetailService.findOne(createdRound.round.id));
    expect(result.finalists.length).toBe(0);

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([]);
  });

  it('should not remove participation in final if player is softly deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundDetailService.updateFinalists(createdRound.round.id, { playerIds: [createdPlayer.id] }));

    let result;
    result = await firstValueFrom(roundDetailService.findOne(createdRound.round.id));
    expect(result.finalists.length).toBe(1);
    expect(result.finalists[0].name).toEqual('John');
    expect(result.finalists[0].deletedDateTime).toBeNull();

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.round.id,
      playerId: createdPlayer.id,
    }]);

    await firstValueFrom(playerService.remove(createdPlayer.id));

    result = await firstValueFrom(roundDetailService.findOne(createdRound.round.id));
    expect(result.finalists.length).toBe(1);
    expect(result.finalists[0].name).toEqual('John');
    expect(result.finalists[0].deletedDateTime).toBeDefined();
    expect(differenceInMilliseconds(new Date(), result.finalists[0].deletedDateTime)).toBeLessThan(1000);

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.round.id,
      playerId: createdPlayer.id,
    }]);
  });
});
