import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeService } from '../event-type/event-type.service';
import { PlaceType } from '../game/enum/place-type.enum';
import { GameDetailService } from '../game/game-detail.service';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PlayerService } from '../player/player.service';
import { RoundDetailService } from '../round/round-detail.service';
import { getDockerDataSource, RANDOM_UUID, truncateAllTables, UUID_V4_REGEX } from '../test.utils';
import { EventContext } from './enum/event-context.enum';
import { EventDetailService } from './event-detail.service';
import { EventEntitySubscriber } from './event.subscriber';

describe('EventDetail', () => {
  let service: EventDetailService;
  let gameDetailService: GameDetailService;
  let roundDetailService: RoundDetailService;
  let playerService: PlayerService;
  let eventTypeService: EventTypeService;
  let source: DataSource;
  let repo: Repository<Event>;
  let playerRepo: Repository<Player>;
  let eventTypeRepo: Repository<EventType>;

  beforeAll(async () => {
    source = await getDockerDataSource();

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        EventDetailService,
        GameDetailService,
        RoundDetailService,
        PlayerService,
        EventTypeService,
        EventEntitySubscriber,
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

    service = moduleRef.get(EventDetailService);
    gameDetailService = moduleRef.get(GameDetailService);
    roundDetailService = moduleRef.get(RoundDetailService);
    playerService = moduleRef.get(PlayerService);
    eventTypeService = moduleRef.get(EventTypeService);
    repo = moduleRef.get<Repository<Event>>(getRepositoryToken(Event));
    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
    eventTypeRepo = moduleRef.get<Repository<EventType>>(getRepositoryToken(EventType));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  });

  describe('creation', () => {
    it('should create successfully with default value', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));
      expect(result).toBeTruthy();
      expect(result.event.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.createDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.lastChangedDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.datetime))).toBeLessThan(1000);
      expect(result.event.context).toEqual(EventContext.GAME);
      expect(result.event.game).toBeUndefined();
      expect(result.event.round).toBeUndefined();
      expect(result.event.player.id).toEqual(createdPlayer.id);
      expect(result.event.eventType.id).toEqual(createdEventType.id);
      expect(result.event.penaltyValue).toBeNull();
      expect(result.event.penaltyUnit).toBeNull();
      expect(result.event.multiplicatorValue).toEqual(1);
      expect(result.event.comment).toBeNull();
    });

    it('should create for GAME successfully', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test', penalty: { penaltyValue: 1, penaltyUnit: PenaltyUnit.BEER_CRATE } }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, comment: 'Lorem ipsum', multiplicatorValue: 1.5 }));
      expect(result).toBeTruthy();
      expect(result.event.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.createDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.lastChangedDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.datetime))).toBeLessThan(1000);
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
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test', penalty: { penaltyValue: 0.75, penaltyUnit: PenaltyUnit.EURO } }));

      const result = await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, comment: 'Lorem ipsum', multiplicatorValue: 1.5 }));
      expect(result).toBeTruthy();
      expect(result.event.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.createDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.lastChangedDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.event.datetime))).toBeLessThan(1000);
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

    it('should fail if game is already completed', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE, completed: true }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });

    it('should fail if round belongs to an already completed game', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE, completed: true }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test' }));

      await expect(firstValueFrom(service.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });

    it('should fail if an unknown game is given', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: createdPlayer.id, eventTypeId: createdEventType.id }))).rejects.toThrow(/Not Found/);
    });

    it('should fail if an unknown round is given', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      await expect(firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: createdPlayer.id, eventTypeId: createdEventType.id }))).rejects.toThrow(/Not Found/);
    });

    it('should fail if an unknown player is given', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: RANDOM_UUID(), eventTypeId: createdEventType.id }))).rejects.toThrow(/violates foreign key constraint/);
    });

    it('should fail if an unknown event type is given', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: RANDOM_UUID() }))).rejects.toThrow(/Could not find event type with id/);
    });

    it('should create many', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John 1' }));
      const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'John 2' }));
      const createdPlayer3 = await firstValueFrom(playerService.create({ name: 'John 3' }));
      const createdPlayer4 = await firstValueFrom(playerService.create({ name: 'John 4' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test', penalty: { penaltyValue: 0.75, penaltyUnit: PenaltyUnit.EURO } }));

      const countBefore = await repo.countBy({ eventType: { id: createdEventType.id } });
      expect(countBefore).toBe(0);

      const result = await firstValueFrom(service.bulkCreate({
        roundId: createdRound.round.id,
        context: EventContext.ROUND,
        eventTypeId: createdEventType.id,
        playerIds: [createdPlayer1.id, createdPlayer2.id, createdPlayer3.id, createdPlayer4.id]
      }));
      expect(result.length).toEqual(4);
      expect(result[0].celebration.count).toEqual(1);
      expect(result[1].celebration).toBeNull();
      expect(result[2].celebration).toBeNull();
      expect(result[3].celebration).toBeNull();

      const countAfter = await repo.countBy({ eventType: { id: createdEventType.id } });
      expect(countAfter).toBe(4);
    });
  });

  describe('removal', () => {
    it('should be removed when related to a game, player and event type', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(service.remove(createdEvent.event.id));
      expect(result).toEqual(createdEvent.event.id);

      await expect(repo.find()).resolves.toEqual([]);

      // game should still exist
      const game = await firstValueFrom(gameDetailService.findOne(createdGame.id));
      expect(game).toBeDefined();

      // player should still exist
      const player = await firstValueFrom(playerService.findOne(createdPlayer.id));
      expect(player).toBeDefined();

      // event type should still exist
      const eventType = await firstValueFrom(eventTypeService.findOne(createdEventType.id));
      expect(eventType).toBeDefined();
    });

    it('should be removed when related to a round, player and event type', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(service.remove(createdEvent.event.id));
      expect(result).toEqual(createdEvent.event.id);

      await expect(repo.find()).resolves.toEqual([]);

      // round should still exist
      const round = await firstValueFrom(roundDetailService.findOne(createdRound.round.id));
      expect(round).toBeDefined();

      // player should still exist
      const player = await firstValueFrom(playerService.findOne(createdPlayer.id));
      expect(player).toBeDefined();

      // event type should still exist
      const eventType = await firstValueFrom(eventTypeService.findOne(createdEventType.id));
      expect(eventType).toBeDefined();
    });

    it('should fail if a related player should be deleted (hard)', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      await expect(playerRepo.delete(createdPlayer.id)).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('should fail if a related event type should be deleted (hard)', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      await expect(eventTypeRepo.delete(createdEventType.id)).rejects.toThrowError(/violates foreign key constraint/);
    });

    it('should load player even if it was softly deleted', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(playerService.remove(createdPlayer.id));
      expect(result).toEqual(createdPlayer.id);

      const event = await repo.findOne({ where: { id: createdEvent.event.id }, relations: ['player'], withDeleted: true });
      expect(event.player.id).toEqual(createdPlayer.id);
      expect(event.player.name).toEqual('John');
      expect(differenceInMilliseconds(new Date(), event.player.deletedDateTime)).toBeLessThan(1000);
    });

    it('should load event type even if it was softly deleted', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(eventTypeService.remove(createdEventType.id));
      expect(result).toEqual(createdEventType.id);

      const event = await repo.findOne({ where: { id: createdEvent.event.id }, relations: ['eventType'], withDeleted: true });
      expect(event.eventType.id).toEqual(createdEventType.id);
      expect(event.eventType.description).toEqual('test');
      expect(differenceInMilliseconds(new Date(), event.eventType.deletedDateTime)).toBeLessThan(1000);
    });

    it('should fail if game to remove not exists', async () => {
      await expect(firstValueFrom(service.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });

    it('should fail if game is already completed', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      await firstValueFrom(gameDetailService.update(createdGame.id, { completed: true }));

      await expect(firstValueFrom(service.remove(createdEvent.event.id))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });

    it('should fail if round belongs to an already completed game', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test' }));
      const createdEvent = await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      await firstValueFrom(gameDetailService.update(createdGame.id, { completed: true }));

      await expect(firstValueFrom(service.remove(createdEvent.event.id))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });
  });
});
