import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { PlaceType } from '../game/enum/place-type.enum';
import { GameService } from '../game/game.service';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { Game } from '../model/game.entity';
import { PlayerService } from '../player/player.service';
import { RoundService } from './round.service';
import { RANDOM_UUID, setupDataSource, truncateAllTables } from '../test.utils';

describe('Finalists', () => {
  let gameService: GameService;
  let roundService: RoundService;
  let playerService: PlayerService;
  let source: DataSource;
  let playerRepo: Repository<Player>;

  beforeAll(async () => {
    source = await setupDataSource([Game, Round, Player, Event, EventType, EventTypeRevision]);

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

  it('should be empty when not specified', async () => {
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));

    const result = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    expect(result.round).toBeTruthy();
    expect(result.round.finalists).toEqual([]);
  });

  it('should be added and removed for an existing round', async () => {
    const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'Jake' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    await firstValueFrom(roundService.addFinalist(createdRound.round.id, createdPlayer1.id));

    let result;
    result = await firstValueFrom(roundService.addFinalist(createdRound.round.id, createdPlayer2.id));
    expect(result.finalists.length).toBe(2);
    expect(result.finalists[0].id).toEqual(createdPlayer1.id);
    expect(result.finalists[1].id).toEqual(createdPlayer2.id);

    result = await firstValueFrom(roundService.removeFinalist(createdRound.round.id, createdPlayer1.id));
    expect(result.finalists.length).toBe(1);
    expect(result.finalists[0].id).toEqual(createdPlayer2.id);
  });

  it('should not be updated with an unknown playerId', async () => {
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    await expect(firstValueFrom(roundService.addFinalist(createdRound.round.id, RANDOM_UUID()))).rejects.toThrowError(/violates foreign key constraint/);
  });

  it('should not remove player when round is removed', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.addFinalist(createdRound.round.id, createdPlayer.id));

    await firstValueFrom(roundService.remove(createdRound.round.id));

    const result = await playerRepo.findOne({ where: { id: createdPlayer.id } });
    expect(result).toBeDefined();
  });

  it('should remove finalist if round is deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.addFinalist(createdRound.round.id, createdPlayer.id));

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.round.id,
      playerId: createdPlayer.id,
    }]);

    await firstValueFrom(roundService.remove(createdRound.round.id));

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([]);
  });

  it('should remove finalist if player is deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.addFinalist(createdRound.round.id, createdPlayer.id));

    let result;
    result = await firstValueFrom(roundService.findOne(createdRound.round.id));
    expect(result.finalists[0].name).toEqual('John');
    expect(result.finalists.length).toBe(1);

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.round.id,
      playerId: createdPlayer.id,
    }]);

    await playerRepo.delete(createdPlayer.id);

    result = await firstValueFrom(roundService.findOne(createdRound.round.id));
    expect(result.finalists.length).toBe(0);

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([]);
  });

  it('should not remove finalist if player is softly deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.addFinalist(createdRound.round.id, createdPlayer.id));

    let result;
    result = await firstValueFrom(roundService.findOne(createdRound.round.id));
    expect(result.finalists.length).toBe(1);
    expect(result.finalists[0].name).toEqual('John');
    expect(result.finalists[0].isDeleted).toEqual(false);

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.round.id,
      playerId: createdPlayer.id,
    }]);

    await firstValueFrom(playerService.remove(createdPlayer.id));

    result = await firstValueFrom(roundService.findOne(createdRound.round.id));
    expect(result.finalists.length).toBe(1);
    expect(result.finalists[0].name).toEqual('John');
    expect(result.finalists[0].isDeleted).toEqual(true);

    queryResult = await source.manager.query(`SELECT * FROM finals`);
    expect(queryResult).toEqual([{
      roundId: createdRound.round.id,
      playerId: createdPlayer.id,
    }]);
  });
});
