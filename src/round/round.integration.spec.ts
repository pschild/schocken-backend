import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeService } from '../event-type/event-type.service';
import { EventContext } from '../event/enum/event-context.enum';
import { EventService } from '../event/event.service';
import { PlaceType } from '../game/enum/place-type.enum';
import { GameService } from '../game/game.service';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PlayerService } from '../player/player.service';
import { RoundService } from './round.service';
import { RANDOM_UUID, setupDataSource, truncateAllTables, UUID_V4_REGEX } from '../test.utils';
import { RoundSubscriber } from './round.subscriber';

describe('Rounds', () => {
  let gameService: GameService;
  let roundService: RoundService;
  let playerService: PlayerService;
  let eventService: EventService;
  let eventTypeService: EventTypeService;
  let source: DataSource;

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
        EventService,
        EventTypeService,
        RoundSubscriber,
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
        },
        {
          provide: getRepositoryToken(Event),
          useValue: source.getRepository(Event),
        },
        {
          provide: getRepositoryToken(EventType),
          useValue: source.getRepository(EventType),
        }
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    gameService = moduleRef.get(GameService);
    roundService = moduleRef.get(RoundService);
    playerService = moduleRef.get(PlayerService);
    eventService = moduleRef.get(EventService);
    eventTypeService = moduleRef.get(EventTypeService);
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  describe('creation', () => {
    it('should be created with an existing gameId', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));

      const result = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      expect(result.round).toBeTruthy();
      expect(result.round.id).toMatch(UUID_V4_REGEX);
      expect(result.round.game.id).toEqual(createdGame.id);
      expect(result.round.attendees).toEqual([]);
      expect(result.round.finalists).toEqual([]);
      expect(differenceInMilliseconds(new Date(), new Date(result.round.createDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.round.lastChangedDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.round.datetime))).toBeLessThan(500);
    });

    it('should fail with an unknown gameId', async () => {
      await expect(firstValueFrom(roundService.create({gameId: RANDOM_UUID()}))).rejects.toThrowError(/Could not find any entity of type "Game" matching/);
    });

    it('should fail if game is already completed', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE, completed: true }));
      await expect(firstValueFrom(roundService.create({ gameId: createdGame.id }))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });
  });

  describe('query', () => {
    it('should find a round including its game', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      const result = await firstValueFrom(roundService.findOne(createdRound.round.id));
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(result.game.id).toEqual(createdGame.id);
      expect(result.game.datetime).toEqual(createdGame.datetime);
      expect(result.game.completed).toEqual(createdGame.completed);
    });

    it('should throw error if round not found', async () => {
      await expect(firstValueFrom(roundService.findOne(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });

    it('should find all rounds', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      const result = await firstValueFrom(roundService.findAll());
      expect(result).toBeTruthy();
      expect(result.length).toBe(2);
      expect(result[0].id).toEqual(createdRound1.round.id);
      expect(result[1].id).toEqual(createdRound2.round.id);
    });

    it('should return empty array if no rounds found', async () => {
      const result = await firstValueFrom(roundService.findAll());
      expect(result).toStrictEqual([]);
    });
  });

  describe('update', () => {
    it('should update a round', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      let result;
      result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.rounds[0].id).toEqual(createdRound1.round.id);
      expect(result.rounds[1].id).toEqual(createdRound2.round.id);

      await firstValueFrom(roundService.update(createdRound2.round.id, { datetime: new Date().toISOString() }));

      result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.rounds[0].id).toEqual(createdRound1.round.id);
      expect(result.rounds[1].id).toEqual(createdRound2.round.id);
    });

    it('should fail if round with given id not found', async () => {
      await expect(firstValueFrom(roundService.update(RANDOM_UUID(), { gameId: RANDOM_UUID() }))).rejects.toThrowError('Not Found');
    });

    it('should fail if game is already completed', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      await firstValueFrom(gameService.update(createdGame.id, { completed: true }));

      await expect(firstValueFrom(roundService.update(createdRound.round.id, { datetime: new Date().toISOString() }))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });
  });

  describe('removal', () => {
    it('should be removed including all referring events', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test' }));
      await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(roundService.findOne(createdRound.round.id));
      expect(result.events).toBeUndefined();

      await firstValueFrom(roundService.remove(createdRound.round.id));

      await expect(firstValueFrom(roundService.findAll())).resolves.toEqual([]);
      await expect(firstValueFrom(eventService.findAll())).resolves.toEqual([]);
    });

    it('should remove a round', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      let result;
      result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);

      await firstValueFrom(roundService.remove(createdRound2.round.id));

      result = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(result.rounds.length).toBe(1);
    });

    it('should fail if round to remove not exists', async () => {
      await expect(firstValueFrom(roundService.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });

    it('should fail if game is already completed', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      await firstValueFrom(gameService.update(createdGame.id, { completed: true }));

      await expect(firstValueFrom(roundService.remove(createdRound.round.id))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });
  });
});
