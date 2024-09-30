import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeService } from '../event-type/event-type.service';
import { EventContext } from '../event/enum/event-context.enum';
import { EventService } from '../event/event.service';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PlayerService } from '../player/player.service';
import { RoundService } from '../round/round.service';
import { RANDOM_UUID, setupDataSource, truncateAllTables, UUID_V4_REGEX } from '../test.utils';
import { PlaceType } from './enum/place-type.enum';
import { GameService } from './game.service';

describe('Games', () => {
  let service: GameService;
  let roundService: RoundService;
  let playerService: PlayerService;
  let eventService: EventService;
  let eventTypeService: EventTypeService;
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
        EventService,
        EventTypeService,
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

    service = moduleRef.get(GameService);
    roundService = moduleRef.get(RoundService);
    playerService = moduleRef.get(PlayerService);
    eventService = moduleRef.get(EventService);
    eventTypeService = moduleRef.get(EventTypeService);
    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  describe('creation', () => {
    it('should create with remote place', async () => {
      const result = await firstValueFrom(service.create({ placeType: PlaceType.REMOTE }));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.datetime))).toBeLessThan(500);
      expect(result.completed).toBe(false);
      expect(result.excludeFromStatistics).toBe(false);
      expect(result.place).toEqual({ type: PlaceType.REMOTE, locationLabel: null, hostedById: undefined });
    });

    it('should create with away place', async () => {
      const result = await firstValueFrom(service.create({ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }));
      expect(result.place).toEqual({ type: PlaceType.AWAY, locationLabel: 'anywhere', hostedById: undefined });
    });

    it('should create with home place', async () => {
      const createdPlayer = await playerRepo.save({ name: 'John' });
      const result = await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));
      expect(result.place).toEqual({ type: PlaceType.HOME, locationLabel: 'John', hostedById: createdPlayer.id });
    });

    it('should fail if an unknown player is given', async () => {
      await expect(firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: RANDOM_UUID() }))).rejects.toThrowError(/violates foreign key constraint/);
    });
  });

  describe('query', () => {
    it('should find a game', async () => {
      const response = await firstValueFrom(service.create({ placeType: PlaceType.REMOTE }));

      const result = await firstValueFrom(service.findOne(response.id));
      expect(result).toBeTruthy();
      expect(result.completed).toBe(false);
      expect(result.excludeFromStatistics).toBe(false);
    });

    it('should throw error if game not found', async () => {
      await expect(firstValueFrom(service.findOne(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });

    it('should find all games', async () => {
      await firstValueFrom(service.create({ placeType: PlaceType.REMOTE }));
      await firstValueFrom(service.create({ placeType: PlaceType.REMOTE }));

      const result = await firstValueFrom(service.findAll());
      expect(result).toBeTruthy();
      expect(result.length).toBe(2);
    });

    it('should return empty array if no games found', async () => {
      const result = await firstValueFrom(service.findAll());
      expect(result).toStrictEqual([]);
    });

    it('should query overview of games', async () => {
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.REMOTE }));
      const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'Jack' }));

      const createdEventType1 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test 1', penalty: { penaltyValue: 0.75, penaltyUnit: PenaltyUnit.EURO } }));
      const createdEventType2 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test 2', penalty: { penaltyValue: 1, penaltyUnit: PenaltyUnit.BEER_CRATE } }));
      const createdEventType3 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test 3', penalty: { penaltyValue: 0.1, penaltyUnit: PenaltyUnit.EURO } }));
      const createdEventType4 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test 4', penalty: { penaltyValue: 2, penaltyUnit: PenaltyUnit.EURO } }));
      const createdEventType5 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test 5' }));

      await firstValueFrom(eventService.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer1.id, eventTypeId: createdEventType1.id }));
      await firstValueFrom(eventService.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer2.id, eventTypeId: createdEventType2.id }));
      await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound1.round.id, playerId: createdPlayer1.id, eventTypeId: createdEventType3.id, multiplicatorValue: 6 }));
      await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound1.round.id, playerId: createdPlayer2.id, eventTypeId: createdEventType4.id }));
      await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound2.round.id, playerId: createdPlayer1.id, eventTypeId: createdEventType5.id }));

      const result = await firstValueFrom(service.getOverview());
      expect(result.length).toBe(1);
      expect(result[0].roundCount).toBe(2);
      expect(result[0].penalties.length).toBe(2);
      expect(result[0].penalties.find(p => p.unit === PenaltyUnit.EURO).sum).toBe(3.35);
      expect(result[0].penalties.find(p => p.unit === PenaltyUnit.BEER_CRATE).sum).toBe(1);
    });
  });

  describe('update', () => {
    it('should be updated', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));
      const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      let result;
      result = await firstValueFrom(service.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.completed).toBe(false);
      expect(result.rounds[0].id).toEqual(createdRound1.round.id);
      expect(result.rounds[1].id).toEqual(createdRound2.round.id);
      expect(result.place).toEqual({ type: PlaceType.HOME, locationLabel: createdPlayer.name, hostedById: createdPlayer.id });

      await firstValueFrom(service.update(createdGame.id, { completed: true }));

      result = await firstValueFrom(service.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.completed).toBe(true);
      expect(result.rounds[0].id).toEqual(createdRound1.round.id);
      expect(result.rounds[1].id).toEqual(createdRound2.round.id);
      expect(result.place).toEqual({ type: PlaceType.HOME, locationLabel: createdPlayer.name, hostedById: createdPlayer.id });
    });

    it('should change HOME to AWAY place', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));

      const result = await firstValueFrom(service.update(createdGame.id, { placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere', hostedById: undefined }));

      expect(result.place).toEqual({ type: PlaceType.AWAY, locationLabel: 'anywhere', hostedById: undefined });
    });

    it('should change AWAY to HOME place', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }));

      const result = await firstValueFrom(service.update(createdGame.id, { placeType: PlaceType.HOME, placeOfAwayGame: null, hostedById: createdPlayer.id }));

      expect(result.place).toEqual({ type: PlaceType.HOME, locationLabel: createdPlayer.name, hostedById: createdPlayer.id });
    });

    it('should fail if game with given id not found', async () => {
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { completed: true }))).rejects.toThrowError('Not Found');
    });
  });

  describe('removal', () => {
    it('should be removed including all referring rounds and events', async () => {
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.REMOTE }));
      const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      await firstValueFrom(eventService.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(service.findOne(createdGame.id));
      expect(result.rounds.length).toBe(2);
      expect(result.rounds[0].id).toEqual(createdRound1.round.id);
      expect(result.rounds[1].id).toEqual(createdRound2.round.id);
      expect(result.events).toBeUndefined();

      await firstValueFrom(service.remove(createdGame.id));

      await expect(firstValueFrom(service.findAll())).resolves.toEqual([]);
      await expect(firstValueFrom(roundService.findAll())).resolves.toEqual([]);
      await expect(firstValueFrom(eventService.findAll())).resolves.toEqual([]);
    });

    it('should be removed when related to a player', async () => {
      const createdPlayer = await playerRepo.save({ name: 'John' });
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));

      const result = await firstValueFrom(service.remove(createdGame.id));
      expect(result).toEqual(createdGame.id);

      // player should still exist
      const player = await firstValueFrom(playerService.findOne(createdPlayer.id));
      expect(player).toBeDefined();
    });

    it('should fail if a related player should be deleted (hard)', async () => {
      const createdPlayer = await playerRepo.save({ name: 'John' });
      await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));

      await expect(playerRepo.delete(createdPlayer.id)).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('should load place even if player was softly deleted', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));

      const result = await firstValueFrom(playerService.remove(createdPlayer.id));
      expect(result).toEqual(createdPlayer.id);

      const game = await firstValueFrom(service.findOne(createdGame.id));
      expect(game.place).toEqual({ type: PlaceType.HOME, locationLabel: 'John', hostedById: createdPlayer.id });
    });

    it('should fail if game to remove not exists', async () => {
      await expect(firstValueFrom(service.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });
  });
});
