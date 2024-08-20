import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { PlaceType } from '../../src/game/enum/place-type.enum';
import { GameService } from '../../src/game/game.service';
import { EventTypeRevision } from '../../src/model/event-type-revision.entity';
import { EventType } from '../../src/model/event-type.entity';
import { GameEvent } from '../../src/model/game-event.entity';
import { Game } from '../../src/model/game.entity';
import { Player } from '../../src/model/player.entity';
import { Round } from '../../src/model/round.entity';
import { RoundService } from '../../src/round/round.service';
import { RANDOM_UUID, setupDataSource, truncateAllTables, UUID_V4_REGEX } from '../../src/test.utils';

describe('Rounds', () => {
  let gameService: GameService;
  let roundService: RoundService;
  let source: DataSource;

  beforeAll(async () => {
    source = await setupDataSource([Game, Round, Player, GameEvent, EventType, EventTypeRevision]);

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
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  it('should be created with an existing gameId', async () => {
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));

    const result = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    expect(result).toBeTruthy();
    expect(result.id).toMatch(UUID_V4_REGEX);
    expect(result.game.id).toEqual(createdGame.id);
    expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(100);
    expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(100);
    expect(differenceInMilliseconds(new Date(), new Date(result.datetime))).toBeLessThan(100);
  });

  it('should not be created with an unknown gameId', async () => {
    await expect(firstValueFrom(roundService.create({gameId: RANDOM_UUID}))).rejects.toThrowError(/violates foreign key constraint/);
  });

  it('should be updated', async () => {
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

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
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    const result = await firstValueFrom(roundService.findOne(createdRound.id));
    expect(result.id).toMatch(UUID_V4_REGEX);
    expect(result.game.id).toEqual(createdGame.id);
    expect(result.game.datetime).toEqual(createdGame.datetime);
    expect(result.game.completed).toEqual(createdGame.completed);
  });

  it('should be removed', async () => {
    const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
    await firstValueFrom(roundService.create({ gameId: createdGame.id }));
    const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

    let result;
    result = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(result.rounds.length).toBe(2);

    await firstValueFrom(roundService.remove(createdRound2.id));

    result = await firstValueFrom(gameService.findOne(createdGame.id));
    expect(result.rounds.length).toBe(1);
  });
});
