import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { EventContext } from '../event/enum/event-context.enum';
import { GameService } from '../game/game.service';
import { EventService } from '../event/event.service';
import { PlaceType } from '../game/enum/place-type.enum';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PlayerService } from '../player/player.service';
import { RANDOM_UUID, setupDataSource, truncateAllTables, UUID_V4_REGEX } from '../test.utils';
import { EventTypeContext } from './enum/event-type-context.enum';
import { EventTypeService } from './event-type.service';
import { DuplicateEventTypeNameException } from './exception/duplicate-event-type-name.exception';

describe('EventTypeService integration', () => {
  let service: EventTypeService;
  let gameService: GameService;
  let playerService: PlayerService;
  let eventService: EventService;
  let source: DataSource;
  let repo: Repository<EventType>;

  beforeAll(async () => {
    source = await setupDataSource([Game, Round, Player, Event, EventType, EventTypeRevision]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        EventTypeService,
        GameService,
        PlayerService,
        EventService,
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
        },
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    service = moduleRef.get(EventTypeService);
    gameService = moduleRef.get(GameService);
    playerService = moduleRef.get(PlayerService);
    eventService = moduleRef.get(EventService);
    repo = moduleRef.get<Repository<EventType>>(getRepositoryToken(EventType));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('creation', () => {
    it('should create an event type', async () => {
      const result = await firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'some event type' }));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(500);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(500);
      expect(result.context).toEqual(EventTypeContext.GAME);
      expect(result.trigger).toBeNull();
      expect(result.hasComment).toEqual(false);
      expect(result.description).toBe('some event type');
      expect(result.penaltyValue).toEqual(0);
      expect(result.penaltyUnit).toBeNull();
      expect(result.multiplicatorUnit).toBeNull();
    });

    it('should fail if an event type with given description already exists', async () => {
      await repo.save({ context: EventTypeContext.GAME, description: 'some event type' });
      await expect(firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'some event type' }))).rejects.toThrowError(new DuplicateEventTypeNameException());
    });
  });

  describe('query', () => {
    it('should find an event type', async () => {
      const response = await repo.save({ context: EventTypeContext.GAME, description: 'some event type', penaltyValue: 1.5, penaltyUnit: PenaltyUnit.EURO, multiplicatorUnit: 'some unit' });

      const result = await firstValueFrom(service.findOne(response.id));
      expect(result).toBeTruthy();
      expect(result.context).toEqual(EventTypeContext.GAME);
      expect(result.trigger).toBeNull();
      expect(result.hasComment).toEqual(false);
      expect(result.description).toBe('some event type');
      expect(result.penaltyValue).toEqual(1.5);
      expect(result.penaltyUnit).toEqual(PenaltyUnit.EURO);
      expect(result.multiplicatorUnit).toEqual('some unit');
    });

    it('should return null if event type not found', async () => {
      const result = await firstValueFrom(service.findOne(RANDOM_UUID()));
      expect(result).toBeNull();
    });

    it('should find all event types', async () => {
      await repo.save({ context: EventTypeContext.GAME, description: 'first event type' });
      await repo.save({ context: EventTypeContext.GAME, description: 'second event type' });

      const result = await firstValueFrom(service.findAll());
      expect(result).toBeTruthy();
      expect(result.length).toBe(2);
      expect(result[0].description).toBe('first event type');
      expect(result[1].description).toBe('second event type');
    });

    it('should return empty array if no event types found', async () => {
      const result = await firstValueFrom(service.findAll());
      expect(result).toStrictEqual([]);
    });
  });

  describe('update', () => {
    it('should update an event type', async () => {
      const response = await repo.save({ context: EventTypeContext.GAME, description: 'first event type' });

      const findResult = await repo.findOneBy({ id: response.id });
      expect(findResult).toBeTruthy();
      expect(findResult.description).toBe('first event type');

      const updateResult = await firstValueFrom(service.update(response.id, { description: 'new event type', penalty: { penaltyValue: 1.5, penaltyUnit: PenaltyUnit.EURO } }));
      expect(updateResult).toBeTruthy();
      expect(updateResult.description).toBe('new event type');
      expect(updateResult.penaltyValue).toEqual(1.5);
      expect(updateResult.penaltyUnit).toEqual(PenaltyUnit.EURO);
    });

    it('should fail if event type with given id not found', async () => {
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { description: 'new event type' }))).rejects.toThrowError('Not Found');
    });

    it('should skip duplicate check if id is the one of existing event type', async () => {
      const createdEventType = await repo.save({  context: EventTypeContext.GAME, description: 'first event type'  });

      const updateResult = await firstValueFrom(service.update(createdEventType.id, { description: 'first event type' }));
      expect(updateResult).toBeTruthy();
      expect(updateResult.description).toBe('first event type');
    });

    it('should fail if an event type with given name already exists', async () => {
      await repo.save({  context: EventTypeContext.GAME, description: 'first event type'  });
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { description: 'first event type' }))).rejects.toThrowError(new DuplicateEventTypeNameException());
    });
  });

  describe('removal', () => {
    it('should remove an event type', async () => {
      const response = await repo.save({ context: EventTypeContext.GAME, description: 'first event type' });
      await repo.save({ context: EventTypeContext.GAME, description: 'second event type' });

      const findResult = await repo.findOneBy({ id: response.id });
      expect(findResult).toBeTruthy();
      expect(findResult.description).toBe('first event type');
      expect(await repo.count()).toBe(2);

      const removalResult = await firstValueFrom(service.remove(response.id));
      expect(removalResult).toBe(response.id);

      expect(await repo.findOneBy({ id: response.id })).toBeNull();
      expect(await repo.count()).toBe(1);
      expect(await repo.count({ withDeleted: true })).toBe(2);
    });

    // TODO: 2
    it('should load event even event type was softly deleted', async () => {
      const createdGame = await firstValueFrom(gameService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(eventService.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      let findResult;
      findResult = await firstValueFrom(eventService.findOne(createdEvent.entity.id));
      expect(findResult.eventType.description).toEqual('test');
      expect(findResult.eventType.isDeleted).toEqual(false);

      await firstValueFrom(service.remove(createdEventType.id));

      findResult = await firstValueFrom(eventService.findOne(createdEvent.entity.id));
      expect(findResult.eventType.description).toEqual('test');
      expect(findResult.eventType.isDeleted).toEqual(true);
    });

    it('should fail if event type to remove not exists', async () => {
      await expect(firstValueFrom(service.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });
  });
});
