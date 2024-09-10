import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeService } from '../event-type/event-type.service';
import { PlaceType } from '../game/enum/place-type.enum';
import { GameService } from '../game/game.service';
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
import { EventContext } from './enum/event-context.enum';
import { EventService } from './event.service';

describe('Events', () => {
  let service: EventService;
  let gameService: GameService;
  let roundService: RoundService;
  let playerService: PlayerService;
  let eventTypeService: EventTypeService;
  let source: DataSource;
  let playerRepo: Repository<Player>;
  let eventTypeRepo: Repository<EventType>;

  beforeAll(async () => {
    source = await setupDataSource([Game, Round, Player, Event, EventType, EventTypeRevision]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        EventService,
        GameService,
        RoundService,
        PlayerService,
        EventTypeService,
        {
          provide: getRepositoryToken(Event),
          useValue: source.getRepository(Event),
        },
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
          provide: getRepositoryToken(EventType),
          useValue: source.getRepository(EventType),
        },
        {
          provide: getRepositoryToken(EventTypeRevision),
          useValue: source.getRepository(EventTypeRevision),
        }
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    service = moduleRef.get(EventService);
    gameService = moduleRef.get(GameService);
    roundService = moduleRef.get(RoundService);
    playerService = moduleRef.get(PlayerService);
    eventTypeService = moduleRef.get(EventTypeService);
    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
    eventTypeRepo = moduleRef.get<Repository<EventType>>(getRepositoryToken(EventType));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  describe('creation', () => {
    it('should create successfully with default value', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));
      expect(result).toBeTruthy();
      expect(result.event.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.createDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.lastChangedDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.datetime))).toBeLessThan(500);
      expect(result.event.context).toEqual(EventContext.GAME);
      expect(result.event.game).toBeUndefined();
      expect(result.event.round).toBeUndefined();
      expect(result.event.player.id).toEqual(createdPlayer.id);
      expect(result.event.eventType.id).toEqual(createdEventType.id);
      expect(result.event.penaltyValue).toEqual(0);
      expect(result.event.penaltyUnit).toBeNull();
      expect(result.event.multiplicatorValue).toEqual(1);
      expect(result.event.comment).toBeNull();
    });

    it('should create for GAME successfully', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test', penalty: { penaltyValue: 1, penaltyUnit: PenaltyUnit.BEER_CRATE } }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, comment: 'Lorem ipsum', multiplicatorValue: 1.5 }));
      expect(result).toBeTruthy();
      expect(result.event.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.createDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.lastChangedDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.datetime))).toBeLessThan(500);
      expect(result.event.context).toEqual(EventContext.GAME);
      expect(result.event.game).toBeUndefined();
      expect(result.event.round).toBeUndefined();
      expect(result.event.player.id).toEqual(createdPlayer.id);
      expect(result.event.eventType.id).toEqual(createdEventType.id);
      expect(result.event.penaltyValue).toEqual(1);
      expect(result.event.penaltyUnit).toEqual(PenaltyUnit.BEER_CRATE);
      expect(result.event.multiplicatorValue).toEqual(1.5);
      expect(result.event.comment).toEqual('Lorem ipsum');
    });

    it('should create for ROUND successfully', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test', penalty: { penaltyValue: 0.75, penaltyUnit: PenaltyUnit.EURO } }));

      const result = await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: createdRound.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, comment: 'Lorem ipsum', multiplicatorValue: 1.5 }));
      expect(result).toBeTruthy();
      expect(result.event.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.createDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.lastChangedDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.datetime))).toBeLessThan(500);
      expect(result.event.context).toEqual(EventContext.ROUND);
      expect(result.event.game).toBeUndefined();
      expect(result.event.round).toBeUndefined();
      expect(result.event.player.id).toEqual(createdPlayer.id);
      expect(result.event.eventType.id).toEqual(createdEventType.id);
      expect(result.event.penaltyValue).toEqual(0.75);
      expect(result.event.penaltyUnit).toEqual(PenaltyUnit.EURO);
      expect(result.event.multiplicatorValue).toEqual(1.5);
      expect(result.event.comment).toEqual('Lorem ipsum');
    });

    it('should fail if an unknown game is given', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: createdPlayer.id, eventTypeId: createdEventType.id }))).rejects.toThrowError(/Could not find any entity of type "Game" matching/);
    });

    it('should fail if an unknown round is given', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      await expect(firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: createdPlayer.id, eventTypeId: createdEventType.id }))).rejects.toThrowError(/Could not find any entity of type "Round" matching/);
    });

    it('should fail if an unknown player is given', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: RANDOM_UUID(), eventTypeId: createdEventType.id }))).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('should fail if an unknown event type is given', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: RANDOM_UUID() }))).rejects.toThrowError(/Could not find event type with id/);
    });
  });

  describe('query', () => {
    it('should find an event', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      const response = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(service.findOne(response.event.id));
      expect(result).toBeTruthy();
      expect(result.context).toEqual(EventContext.GAME);
      expect(result.game).toBeUndefined();
      expect(result.round).toBeUndefined();
      expect(result.player.id).toEqual(createdPlayer.id);
      expect(result.eventType.id).toEqual(createdEventType.id);
      expect(result.penaltyValue).toEqual(0);
      expect(result.penaltyUnit).toBeNull();
      expect(result.multiplicatorValue).toEqual(1);
      expect(result.comment).toBeNull();
    });

    it('should return null if event not found', async () => {
      const result = await firstValueFrom(service.findOne(RANDOM_UUID()));
      expect(result).toBeNull();
    });

    it('should find all events', async () => {
      const createdGame1 = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType1 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test1' }));

      const createdGame2 = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame2.id }));
      const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'Jack' }));
      const createdEventType2 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test2' }));

      await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame1.id, playerId: createdPlayer1.id, eventTypeId: createdEventType1.id }));
      await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: createdRound2.id, playerId: createdPlayer2.id, eventTypeId: createdEventType2.id }));

      const result = await firstValueFrom(service.findAll());
      expect(result).toBeTruthy();
      expect(result.length).toBe(2);
    });

    it('should return empty array if no events found', async () => {
      const result = await firstValueFrom(service.findAll());
      expect(result).toStrictEqual([]);
    });
  });

  describe('update', () => {
    it('should be updated', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      let result;
      result = await firstValueFrom(service.findOne(createdEvent.event.id));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.datetime))).toBeLessThan(500);
      expect(result.context).toEqual(EventContext.GAME);
      expect(result.game).toBeUndefined();
      expect(result.round).toBeUndefined();
      expect(result.player.id).toEqual(createdPlayer.id);
      expect(result.eventType.id).toEqual(createdEventType.id);
      expect(result.penaltyValue).toEqual(0);
      expect(result.penaltyUnit).toBeNull();
      expect(result.multiplicatorValue).toEqual(1);
      expect(result.comment).toBeNull();

      await firstValueFrom(service.update(createdEvent.event.id, { multiplicatorValue: 1.5, comment: 'Lorem ipsum' }));

      result = await firstValueFrom(service.findOne(createdEvent.event.id));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.datetime))).toBeLessThan(500);
      expect(result.context).toEqual(EventContext.GAME);
      expect(result.game).toBeUndefined();
      expect(result.round).toBeUndefined();
      expect(result.player.id).toEqual(createdPlayer.id);
      expect(result.eventType.id).toEqual(createdEventType.id);
      expect(result.penaltyValue).toEqual(0);
      expect(result.penaltyUnit).toBeNull();
      expect(result.multiplicatorValue).toEqual(1.5);
      expect(result.comment).toEqual('Lorem ipsum');
    });

    it('should fail if event with given id not found', async () => {
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { comment: 'Lorem ipsum' }))).rejects.toThrowError('Not Found');
    });
  });

  describe('removal', () => {
    it('should be removed when related to a game, player and event type', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(service.remove(createdEvent.event.id));
      expect(result).toEqual(createdEvent.event.id);

      await expect(firstValueFrom(service.findAll())).resolves.toEqual([]);

      // game should still exist
      const game = await firstValueFrom(gameService.findOne(createdGame.id));
      expect(game).toBeDefined();

      // player should still exist
      const player = await firstValueFrom(playerService.findOne(createdPlayer.id));
      expect(player).toBeDefined();

      // event type should still exist
      const eventType = await firstValueFrom(eventTypeService.findOne(createdEventType.id));
      expect(eventType).toBeDefined();
    });

    it('should be removed when related to a round, player and event type', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: createdRound.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(service.remove(createdEvent.event.id));
      expect(result).toEqual(createdEvent.event.id);

      await expect(firstValueFrom(service.findAll())).resolves.toEqual([]);

      // round should still exist
      const round = await firstValueFrom(roundService.findOne(createdGame.id));
      expect(round).toBeDefined();

      // player should still exist
      const player = await firstValueFrom(playerService.findOne(createdPlayer.id));
      expect(player).toBeDefined();

      // event type should still exist
      const eventType = await firstValueFrom(eventTypeService.findOne(createdEventType.id));
      expect(eventType).toBeDefined();
    });

    it('should fail if a related player should be deleted (hard)', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      await expect(playerRepo.delete(createdPlayer.id)).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('should fail if a related event type should be deleted (hard)', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      await expect(eventTypeRepo.delete(createdEventType.id)).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('should load player even if it was softly deleted', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(playerService.remove(createdPlayer.id));
      expect(result).toEqual(createdPlayer.id);

      const event = await firstValueFrom(service.findOne(createdEvent.event.id));
      expect(event.player).toMatchObject({ id: createdPlayer.id, name: 'John', isDeleted: true });
    });

    it('should load event type even if it was softly deleted', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(eventTypeService.remove(createdEventType.id));
      expect(result).toEqual(createdEventType.id);

      const event = await firstValueFrom(service.findOne(createdEvent.event.id));
      expect(event.eventType).toMatchObject({ id: createdEventType.id, description: 'test', isDeleted: true });
    });

    it('should fail if game to remove not exists', async () => {
      await expect(firstValueFrom(service.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });
  });
});
