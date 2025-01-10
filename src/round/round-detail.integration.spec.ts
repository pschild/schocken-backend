import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeService } from '../event-type/event-type.service';
import { EventContext } from '../event/enum/event-context.enum';
import { EventDetailService } from '../event/event-detail.service';
import { PlaceType } from '../game/enum/place-type.enum';
import { GameDetailService } from '../game/game-detail.service';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PlayerService } from '../player/player.service';
import { getDockerDataSource, RANDOM_UUID, truncateAllTables, UUID_V4_REGEX } from '../test.utils';
import { RoundDetailService } from './round-detail.service';
import { RoundSubscriber } from './round.subscriber';

describe('RoundDetail', () => {
  let gameDetailService: GameDetailService;
  let roundDetailService: RoundDetailService;
  let playerService: PlayerService;
  let eventService: EventDetailService;
  let eventTypeService: EventTypeService;
  let roundRepo: Repository<Round>;
  let eventRepo: Repository<Event>;
  let source: DataSource;

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
        EventDetailService,
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

    gameDetailService = moduleRef.get(GameDetailService);
    roundDetailService = moduleRef.get(RoundDetailService);
    playerService = moduleRef.get(PlayerService);
    eventService = moduleRef.get(EventDetailService);
    eventTypeService = moduleRef.get(EventTypeService);
    roundRepo = moduleRef.get<Repository<Round>>(getRepositoryToken(Round));
    eventRepo = moduleRef.get<Repository<Event>>(getRepositoryToken(Event));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  });

  describe('creation', () => {
    it('should be created with an existing gameId', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));

      const result = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      expect(result.round).toBeTruthy();
      expect(result.round.id).toMatch(UUID_V4_REGEX);
      expect(result.round.game.id).toEqual(createdGame.id);
      expect(result.round.attendees).toEqual([]);
      expect(result.round.finalists).toEqual([]);
      expect(differenceInMilliseconds(new Date(), new Date(result.round.createDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.round.lastChangedDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.round.datetime))).toBeLessThan(1000);

      expect(result.celebration).toEqual({ label: 'Runden', count: 1 });
    });

    it('should be created with an existing gameId and initial attendees', async () => {
      const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'Jack' }));
      const attendeeIds = [createdPlayer1, createdPlayer2].map(p => p.id);

      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      await firstValueFrom(roundDetailService.create({ gameId: createdGame.id, attendees: attendeeIds }));

      const result = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      expect(result.round.attendees.map(p => p.id)).toEqual(attendeeIds);

      expect(result.celebration).toBeNull();
    });

    it('should be created with the attendees of previous round', async () => {
      const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'Jack' }));
      const createdPlayer3 = await firstValueFrom(playerService.create({ name: 'Jane' }));
      const attendeeIdsOfLastRound = [createdPlayer1, createdPlayer2, createdPlayer3].map(p => p.id);

      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      await firstValueFrom(roundDetailService.create({ gameId: createdGame.id, attendees: [createdPlayer1.id, createdPlayer2.id] }));
      await firstValueFrom(roundDetailService.create({ gameId: createdGame.id, attendees: attendeeIdsOfLastRound }));

      const result = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      expect(result.round.attendees.map(p => p.id)).toEqual(attendeeIdsOfLastRound);

      expect(result.celebration).toBeNull();
    });

    it('should fail with an unknown gameId', async () => {
      await expect(firstValueFrom(roundDetailService.create({gameId: RANDOM_UUID()}))).rejects.toThrowError(/Could not find any entity of type "Game" matching/);
    });

    it('should fail if game is already completed', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE, completed: true }));
      await expect(firstValueFrom(roundDetailService.create({ gameId: createdGame.id }))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });
  });

  describe('query', () => {
    it('should find a round including its game', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

      const result = await firstValueFrom(roundDetailService.findOne(createdRound.round.id));
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(result.game.id).toEqual(createdGame.id);
      expect(result.game.datetime).toEqual(createdGame.datetime);
      expect(result.game.completed).toEqual(createdGame.completed);
      expect(result.attendees).toEqual([]);
      expect(result.finalists).toEqual([]);
    });

    it('should throw error if round not found', async () => {
      await expect(firstValueFrom(roundDetailService.findOne(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });

    it('should get datetime of game of round', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

      const result = await firstValueFrom(roundDetailService.getGameDatetime(createdRound.round.id));
      expect(result).toBeTruthy();
      expect(differenceInMilliseconds(new Date(), new Date(result))).toBeLessThan(1000);
    });

    it('should find round details by id', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id, datetime: '2024-11-26T12:34:00' }));

      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test' }));
      const createdEvent1 = await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, datetime: '2024-11-26T12:35:02' }));
      const createdEvent2 = await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, datetime: '2024-11-26T12:35:03' }));
      const createdEvent3 = await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, datetime: '2024-11-26T12:35:01' }));

      const result = await firstValueFrom(roundDetailService.getDetails(createdRound.round.id));
      expect(result).toBeDefined();
      expect(result.id).toEqual(createdRound.round.id);
      expect(result.attendees).toEqual([]);
      expect(result.finalists).toEqual([]);
      expect(result.events.map(event => event.id)).toEqual([createdEvent3.event.id, createdEvent1.event.id, createdEvent2.event.id]);
      expect(result.events.every(event => event.player.name === createdPlayer.name)).toBeTruthy();
      expect(result.events.every(event => event.eventType.description === createdEventType.description)).toBeTruthy();
    });

    it('should find rounds by gameId', async () => {
      const createdGame1 = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound1 = await firstValueFrom(roundDetailService.create({ gameId: createdGame1.id, datetime: '2024-11-26T12:34:00' }));
      const createdRound2 = await firstValueFrom(roundDetailService.create({ gameId: createdGame1.id, datetime: '2024-11-26T12:33:00' }));
      const createdRound3 = await firstValueFrom(roundDetailService.create({ gameId: createdGame1.id, datetime: '2024-11-26T12:35:00' }));

      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test' }));
      const createdEvent1 = await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound3.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, datetime: '2024-11-26T12:35:02' }));
      const createdEvent2 = await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound3.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, datetime: '2024-11-26T12:35:03' }));
      const createdEvent3 = await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound3.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id, datetime: '2024-11-26T12:35:01' }));

      const createdGame2 = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      await firstValueFrom(roundDetailService.create({ gameId: createdGame2.id }));

      const result = await firstValueFrom(roundDetailService.findByGameId(createdGame1.id));
      expect(result.length).toBe(3);
      expect(result.map(round => round.id)).toEqual([createdRound2.round.id, createdRound1.round.id, createdRound3.round.id]);
      expect(result.find(round => round.id === createdRound3.round.id).events.map(event => event.id)).toEqual([createdEvent3.event.id, createdEvent1.event.id, createdEvent2.event.id]);
    });
  });

  describe('update', () => {
    it('should update attendees', async () => {

    });

    it('should update finalists', async () => {

    });

    it('should fail updating attendees if round with given id not found', async () => {
      await expect(firstValueFrom(roundDetailService.updateAttendees(RANDOM_UUID(), { playerIds: [RANDOM_UUID()] }))).rejects.toThrowError(/Could not find any entity/);
    });

    it('should fail updating finalists if round with given id not found', async () => {
      await expect(firstValueFrom(roundDetailService.updateFinalists(RANDOM_UUID(), { playerIds: [RANDOM_UUID()] }))).rejects.toThrowError(/Could not find any entity/);
    });

    it('should fail updating attendees if game is already completed', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

      await firstValueFrom(gameDetailService.update(createdGame.id, { completed: true }));

      await expect(firstValueFrom(roundDetailService.updateAttendees(createdRound.round.id, { playerIds: [createdPlayer.id] }))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });

    it('should fail updating finalists if game is already completed', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

      await firstValueFrom(gameDetailService.update(createdGame.id, { completed: true }));

      await expect(firstValueFrom(roundDetailService.updateFinalists(createdRound.round.id, { playerIds: [createdPlayer.id] }))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });
  });

  describe('removal', () => {
    it('should be removed including all referring events', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test' }));
      await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound.round.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(roundDetailService.findOne(createdRound.round.id));
      expect(result.events).toBeUndefined();

      await firstValueFrom(roundDetailService.remove(createdRound.round.id));

      await expect(roundRepo.find()).resolves.toEqual([]);
      await expect(eventRepo.find()).resolves.toEqual([]);
    });

    it('should remove a round', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));
      const createdRound2 = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

      let rounds;
      rounds = await roundRepo.find({ where: { game: { id: createdGame.id } }});
      expect(rounds.length).toBe(2);

      await firstValueFrom(roundDetailService.remove(createdRound2.round.id));

      rounds = await roundRepo.find({ where: { game: { id: createdGame.id } }});
      expect(rounds.length).toBe(1);
    });

    it('should fail if round to remove not exists', async () => {
      await expect(firstValueFrom(roundDetailService.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });

    it('should fail if game is already completed', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdRound = await firstValueFrom(roundDetailService.create({ gameId: createdGame.id }));

      await firstValueFrom(gameDetailService.update(createdGame.id, { completed: true }));

      await expect(firstValueFrom(roundDetailService.remove(createdRound.round.id))).rejects.toThrow(new RegExp(`Das Spiel mit der ID ${createdGame.id} ist bereits abgeschlossen`));
    });
  });
});
