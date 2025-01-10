import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { EventContext } from '../event/enum/event-context.enum';
import { EventDetailService } from '../event/event-detail.service';
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
import { EventTypeContext } from './enum/event-type-context.enum';
import { EventTypeRevisionType } from './enum/event-type-revision-type.enum';
import { EventTypeService } from './event-type.service';
import { EventTypeSubscriber } from './event-type.subscriber';
import { DuplicateEventTypeNameException } from './exception/duplicate-event-type-name.exception';

describe('EventTypeService integration', () => {
  let service: EventTypeService;
  let gameDetailService: GameDetailService;
  let roundDetailService: RoundDetailService;
  let playerService: PlayerService;
  let eventService: EventDetailService;
  let source: DataSource;
  let repo: Repository<EventType>;
  let eventRepo: Repository<Event>;

  beforeAll(async () => {
    source = await getDockerDataSource();

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        EventTypeService,
        GameDetailService,
        RoundDetailService,
        PlayerService,
        EventDetailService,
        EventTypeSubscriber,
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
        {
          provide: getRepositoryToken(EventTypeRevision),
          useValue: source.getRepository(EventTypeRevision),
        },
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    service = moduleRef.get(EventTypeService);
    gameDetailService = moduleRef.get(GameDetailService);
    roundDetailService = moduleRef.get(RoundDetailService);
    playerService = moduleRef.get(PlayerService);
    eventService = moduleRef.get(EventDetailService);
    repo = moduleRef.get<Repository<EventType>>(getRepositoryToken(EventType));
    eventRepo = moduleRef.get<Repository<Event>>(getRepositoryToken(Event));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('creation', () => {
    it('should create an event type', async () => {
      const result = await firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'some event type' }));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(1000);
      expect(result.context).toEqual(EventTypeContext.GAME);
      expect(result.trigger).toBeNull();
      expect(result.hasComment).toEqual(false);
      expect(result.description).toBe('some event type');
      expect(result.penaltyValue).toBeNull();
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

    it('should fail if eventType is not found', async () => {
      await expect(firstValueFrom(service.findValidPenalty(RANDOM_UUID(), EventContext.GAME, new Date('2020-02-02')))).rejects.toThrowError(/Could not find event type with id/);
    });

    it('should find valid penalty', async () => {
      const createdEventType = await firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'some event type', penalty: { penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO }, createDateTime: new Date('2020-01-01') }));
      await firstValueFrom(service.update(createdEventType.id, { penalty: { penaltyValue: 1, penaltyUnit: PenaltyUnit.EURO }, createDateTime: new Date('2020-03-03') }));

      // manipulate revisions manually
      await source.manager.query(`UPDATE event_type_revision SET "createDateTime" = '${new Date('2020-01-01').toISOString()}' WHERE "eventTypeId" = '${createdEventType.id}' AND type = '${EventTypeRevisionType.INSERT}'`);
      await source.manager.query(`UPDATE event_type_revision SET "createDateTime" = '${new Date('2020-03-03').toISOString()}' WHERE "eventTypeId" = '${createdEventType.id}' AND type = '${EventTypeRevisionType.UPDATE}'`);

      const result = await firstValueFrom(service.findValidPenalty(createdEventType.id, EventContext.GAME, new Date('2020-02-02')));
      expect(result.penaltyValue).toEqual(0.5);
      expect(result.penaltyUnit).toEqual(PenaltyUnit.EURO);
      expect(result.warning).toEqual('Der aktuelle Betrag der Strafe (1 EURO) wurde automatisch auf den zum Zeitpunkt des Spiels gültigen Betrag (0.5 EURO am/um 02.02.2020 01:00:00) angepasst.');
    });

    it('should create overview of event types', async () => {
      const player = await firstValueFrom(playerService.create({ name: 'John' }));
      const game = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const round = (await firstValueFrom(roundDetailService.create({ gameId: game.id }))).round;

      const eventType1 = await firstValueFrom(service.create({ context: EventTypeContext.ROUND, description: 'event type 1' }));
      const eventType2 = await firstValueFrom(service.create({ context: EventTypeContext.ROUND, description: 'event type 2' }));
      const eventType3 = await firstValueFrom(service.create({ context: EventTypeContext.ROUND, description: 'event type 3' }));
      const eventType4 = await firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'event type 4' }));
      await firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'event type 5' }));

      await eventRepo.save({ context: EventContext.ROUND, eventType: { id: eventType1.id }, round: { id: round.id }, player: { id: player.id } });
      await eventRepo.save({ context: EventContext.ROUND, eventType: { id: eventType2.id }, round: { id: round.id }, player: { id: player.id } });
      await eventRepo.save({ context: EventContext.ROUND, eventType: { id: eventType2.id }, round: { id: round.id }, player: { id: player.id } });
      await eventRepo.save({ context: EventContext.ROUND, eventType: { id: eventType3.id }, round: { id: round.id }, player: { id: player.id } });
      await eventRepo.save({ context: EventContext.GAME, eventType: { id: eventType4.id }, game: { id: game.id }, player: { id: player.id } });

      const roundEventTypes = await firstValueFrom(service.getOverviewByContext(EventTypeContext.ROUND));
      expect(roundEventTypes.length).toEqual(3);
      expect(roundEventTypes.map(i => i.count)).toEqual(['2', '1', '1']);
      expect(roundEventTypes.map(i => i.description)).toEqual(['event type 2', 'event type 1', 'event type 3']);

      const gameEventTypes = await firstValueFrom(service.getOverviewByContext(EventTypeContext.GAME));
      expect(gameEventTypes.length).toEqual(2);
      expect(gameEventTypes.map(i => i.count)).toEqual(['1', '0']);
      expect(gameEventTypes.map(i => i.description)).toEqual(['event type 4', 'event type 5']);
    });
  });

  describe('update', () => {
    it('should update an event type', async () => {
      const response = await repo.save({ context: EventTypeContext.GAME, description: 'first event type' });

      const findResult = await repo.findOneBy({ id: response.id });
      expect(findResult).toBeTruthy();
      expect(findResult.description).toBe('first event type');
      expect(findResult.penaltyValue).toBeNull();
      expect(findResult.penaltyUnit).toBeNull();

      const updateResult = await firstValueFrom(service.update(response.id, { description: 'new event type', penalty: { penaltyValue: 1.5, penaltyUnit: PenaltyUnit.EURO } }));
      expect(updateResult).toBeTruthy();
      expect(updateResult.description).toBe('new event type');
      expect(updateResult.penaltyValue).toEqual(1.5);
      expect(updateResult.penaltyUnit).toEqual(PenaltyUnit.EURO);
    });

    it('should remove penalty by passing null', async () => {
      const response = await repo.save({ context: EventTypeContext.GAME, description: 'first event type', penaltyValue: 1.5, penaltyUnit: PenaltyUnit.EURO });

      const findResult = await repo.findOneBy({ id: response.id });
      expect(findResult).toBeTruthy();
      expect(findResult.description).toBe('first event type');
      expect(findResult.penaltyValue).toEqual(1.5);
      expect(findResult.penaltyUnit).toEqual(PenaltyUnit.EURO);

      const updateResult = await firstValueFrom(service.update(response.id, { description: 'new event type', penalty: null }));
      expect(updateResult).toBeTruthy();
      expect(updateResult.description).toBe('new event type');
      expect(updateResult.penaltyValue).toBeNull();
      expect(updateResult.penaltyUnit).toBeNull();
    });

    it('should remove penalty by passing object with null properties', async () => {
      const response = await repo.save({ context: EventTypeContext.GAME, description: 'first event type', penaltyValue: 1.5, penaltyUnit: PenaltyUnit.EURO });

      const findResult = await repo.findOneBy({ id: response.id });
      expect(findResult).toBeTruthy();
      expect(findResult.description).toBe('first event type');
      expect(findResult.penaltyValue).toEqual(1.5);
      expect(findResult.penaltyUnit).toEqual(PenaltyUnit.EURO);

      const updateResult = await firstValueFrom(service.update(response.id, { description: 'new event type', penalty: { penaltyValue: null, penaltyUnit: null } }));
      expect(updateResult).toBeTruthy();
      expect(updateResult.description).toBe('new event type');
      expect(updateResult.penaltyValue).toBeNull();
      expect(updateResult.penaltyUnit).toBeNull();
    });

    it('should fail if event type with given id not found', async () => {
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { description: 'new event type' }))).rejects.toThrowError('Not Found');
    });

    it('should skip duplicate check if id is the one of existing event type', async () => {
      const createdEventType = await repo.save({  context: EventTypeContext.GAME, description: 'first event type'  });

      const updateResult = await firstValueFrom(service.update(createdEventType.id, { description: 'first event type', hasComment: true }));
      expect(updateResult).toBeTruthy();
      expect(updateResult.description).toBe('first event type');
    });

    it('should fail if an event type with given name already exists', async () => {
      await repo.save({  context: EventTypeContext.GAME, description: 'first event type' });
      const createdEventType2 = await repo.save({  context: EventTypeContext.GAME, description: 'second event type' });

      await expect(firstValueFrom(service.update(createdEventType2.id, { description: 'first event type' }))).rejects.toThrowError(new DuplicateEventTypeNameException());
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

    it('should load event even event type was softly deleted', async () => {
      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE }));
      const createdPlayer = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdEventType = await firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'test' }));
      const createdEvent = await firstValueFrom(eventService.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer.id, eventTypeId: createdEventType.id }));

      let findResult;
      findResult = await eventRepo.findOne({ where: { id: createdEvent.event.id }, relations: ['eventType'], withDeleted: true });
      expect(findResult.eventType.description).toEqual('test');
      expect(findResult.eventType.deletedDateTime).toBeNull();

      await firstValueFrom(service.remove(createdEventType.id));

      findResult = await eventRepo.findOne({ where: { id: createdEvent.event.id }, relations: ['eventType'], withDeleted: true });
      expect(findResult.eventType.description).toEqual('test');
      expect(findResult.eventType.deletedDateTime).toBeDefined();
      expect(differenceInMilliseconds(new Date(), findResult.eventType.deletedDateTime)).toBeLessThan(1000);
    });

    it('should fail if event type to remove not exists', async () => {
      await expect(firstValueFrom(service.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });
  });
});
