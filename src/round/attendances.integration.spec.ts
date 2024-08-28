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

describe('Attendances', () => {
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
    expect(result).toBeTruthy();
    expect(result.attendees).toEqual([]);
  });

  it('should be updated for an existing round', async () => {
    const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'Jake' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    let result;
    result = await firstValueFrom(roundService.updateAttendees(createdRound.id, { playerIds: [createdPlayer1.id, createdPlayer2.id] }));
    expect(result.attendees.length).toBe(2);
    expect(result.attendees[0].id).toEqual(createdPlayer1.id);
    expect(result.attendees[1].id).toEqual(createdPlayer2.id);

    result = await firstValueFrom(roundService.updateAttendees(createdRound.id, { playerIds: [createdPlayer2.id] }));
    expect(result.attendees.length).toBe(1);
    expect(result.attendees[0].id).toEqual(createdPlayer2.id);
  });

  it('should not be updated with an unknown playerId', async () => {
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    await expect(firstValueFrom(roundService.updateAttendees(createdRound.id, { playerIds: [RANDOM_UUID()] }))).rejects.toThrowError(/violates foreign key constraint/);
  });

  it('should not remove player when round is removed', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.updateAttendees(createdRound.id, { playerIds: [createdPlayer.id] }));

    await firstValueFrom(roundService.remove(createdRound.id));

    const result = await firstValueFrom(playerService.findOne(createdPlayer.id));
    expect(result).toBeDefined();
  });

  it('should remove attendance if round is deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.updateAttendees(createdRound.id, { playerIds: [createdPlayer.id] }));

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM attendances`);
    expect(queryResult).toEqual([{
      roundId: createdRound.id,
      playerId: createdPlayer.id,
    }]);

    await firstValueFrom(roundService.remove(createdRound.id));

    queryResult = await source.manager.query(`SELECT * FROM attendances`);
    expect(queryResult).toEqual([]);
  });

  it('should remove attendance if player is deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.updateAttendees(createdRound.id, { playerIds: [createdPlayer.id] }));

    let result;
    result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.attendees.length).toBe(1);
    expect(result.attendees[0].name).toEqual('John');

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM attendances`);
    expect(queryResult).toEqual([{
      roundId: createdRound.id,
      playerId: createdPlayer.id,
    }]);

    await playerRepo.delete(createdPlayer.id);

    result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.attendees.length).toBe(0);

    queryResult = await source.manager.query(`SELECT * FROM attendances`);
    expect(queryResult).toEqual([]);
  });

  it('should not remove attendance if player is softly deleted', async () => {
    const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    await firstValueFrom(roundService.updateAttendees(createdRound.id, { playerIds: [createdPlayer.id] }));

    let result;
    result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.attendees.length).toBe(1);
    expect(result.attendees[0].name).toEqual('John');
    expect(result.attendees[0].isDeleted).toEqual(false);

    let queryResult;
    queryResult = await source.manager.query(`SELECT * FROM attendances`);
    expect(queryResult).toEqual([{
      roundId: createdRound.id,
      playerId: createdPlayer.id,
    }]);

    await firstValueFrom(playerService.remove(createdPlayer.id));

    result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.attendees.length).toBe(1);
    expect(result.attendees[0].name).toEqual('John');
    expect(result.attendees[0].isDeleted).toEqual(true);

    queryResult = await source.manager.query(`SELECT * FROM attendances`);
    expect(queryResult).toEqual([{
      roundId: createdRound.id,
      playerId: createdPlayer.id,
    }]);
  });
});
