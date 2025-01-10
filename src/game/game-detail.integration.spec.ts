import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeService } from '../event-type/event-type.service';
import { EventContext } from '../event/enum/event-context.enum';
import { EventDetailService } from '../event/event-detail.service';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PlayerService } from '../player/player.service';
import { RoundDetailService } from '../round/round-detail.service';
import { getDockerDataSource, RANDOM_UUID, truncateAllTables, UUID_V4_REGEX } from '../test.utils';
import { PlaceType } from './enum/place-type.enum';
import { GameDetailService } from './game-detail.service';

describe('GameDetail', () => {
  let service: GameDetailService;
  let roundService: RoundDetailService;
  let playerService: PlayerService;
  let eventService: EventDetailService;
  let eventTypeService: EventTypeService;
  let source: DataSource;
  let gameRepo: Repository<Game>;
  let playerRepo: Repository<Player>;
  let roundRepo: Repository<Round>;
  let eventRepo: Repository<Event>;

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

    service = moduleRef.get(GameDetailService);
    roundService = moduleRef.get(RoundDetailService);
    playerService = moduleRef.get(PlayerService);
    eventService = moduleRef.get(EventDetailService);
    eventTypeService = moduleRef.get(EventTypeService);
    gameRepo = moduleRef.get<Repository<Game>>(getRepositoryToken(Game));
    roundRepo = moduleRef.get<Repository<Round>>(getRepositoryToken(Round));
    eventRepo = moduleRef.get<Repository<Event>>(getRepositoryToken(Event));
    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  });

  describe('creation', () => {
    it('should create with remote place', async () => {
      const result = await firstValueFrom(service.create({ placeType: PlaceType.REMOTE }));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.datetime))).toBeLessThan(1000);
      expect(result.completed).toBe(false);
      expect(result.excludeFromStatistics).toBe(false);
      expect(result.placeType).toEqual(PlaceType.REMOTE);
      expect(result.placeOfAwayGame).toBeNull();
      expect(result.hostedBy).toBeNull();
    });

    it('should create with away place', async () => {
      const result = await firstValueFrom(service.create({ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }));
      expect(result.placeType).toEqual(PlaceType.AWAY);
      expect(result.placeOfAwayGame).toEqual('anywhere');
      expect(result.hostedBy).toBeNull();
    });

    it('should create with home place', async () => {
      const createdPlayer = await playerRepo.save({ name: 'John' });
      const result = await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));
      expect(result.placeType).toEqual(PlaceType.HOME);
      expect(result.placeOfAwayGame).toBeNull();
      expect(result.hostedBy.id).toEqual(createdPlayer.id);
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

    it('should get datetime of game', async () => {
      const response = await firstValueFrom(service.create({ placeType: PlaceType.REMOTE }));

      const result = await firstValueFrom(service.getDatetime(response.id));
      expect(result).toBeTruthy();
      expect(differenceInMilliseconds(new Date(), new Date(result))).toBeLessThan(1000);
    });

    it('should throw error if game not found', async () => {
      await expect(firstValueFrom(service.findOne(RANDOM_UUID()))).rejects.toThrowError(/Not Found/);
    });
  });

  describe('update', () => {
    it('should be updated', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));

      let result;
      result = await firstValueFrom(service.findOne(createdGame.id));
      expect(result.completed).toBe(false);
      expect(result.placeType).toEqual(PlaceType.HOME);
      expect(result.placeOfAwayGame).toBeNull();
      expect(result.hostedBy.id).toEqual(createdPlayer.id);
      expect(result.events).toEqual([]);

      await firstValueFrom(service.update(createdGame.id, { completed: true }));

      result = await firstValueFrom(service.findOne(createdGame.id));
      expect(result.completed).toBe(true);
      expect(result.placeType).toEqual(PlaceType.HOME);
      expect(result.placeOfAwayGame).toBeNull();
      expect(result.hostedBy.id).toEqual(createdPlayer.id);
      expect(result.events).toEqual([]);
    });

    it('should change HOME to AWAY place', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.HOME, hostedById: createdPlayer.id }));

      const result = await firstValueFrom(service.update(createdGame.id, { placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere', hostedById: undefined }));

      expect(result.placeType).toEqual(PlaceType.AWAY);
      expect(result.placeOfAwayGame).toEqual('anywhere');
      expect(result.hostedBy).toBeNull();
    });

    it('should change AWAY to HOME place', async () => {
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdGame = await firstValueFrom(service.create({ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }));

      const result = await firstValueFrom(service.update(createdGame.id, { placeType: PlaceType.HOME, placeOfAwayGame: null, hostedById: createdPlayer.id }));

      expect(result.placeType).toEqual(PlaceType.HOME);
      expect(result.placeOfAwayGame).toBeNull();
      expect(result.hostedBy.id).toEqual(createdPlayer.id);
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
      const createdEvent = await firstValueFrom(eventService.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      const result = await firstValueFrom(service.findOne(createdGame.id));
      expect(result.events.length).toEqual(1);
      expect(result.events[0].id).toEqual(createdEvent.event.id);

      const rounds = await roundRepo.find();
      expect(rounds.length).toEqual(2);
      expect(rounds[0].id).toEqual(createdRound1.round.id);
      expect(rounds[1].id).toEqual(createdRound2.round.id);

      await firstValueFrom(service.remove(createdGame.id));

      await expect(gameRepo.find()).resolves.toEqual([]);
      await expect(roundRepo.find()).resolves.toEqual([]);
      await expect(eventRepo.find()).resolves.toEqual([]);
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
      expect(game.placeType).toEqual(PlaceType.HOME);
      expect(game.placeOfAwayGame).toBeNull();
      expect(game.hostedBy.id).toEqual(createdPlayer.id);
    });

    it('should fail if game to remove not exists', async () => {
      await expect(firstValueFrom(service.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });
  });
});
