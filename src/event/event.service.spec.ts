import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom, of, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { EventTypeService } from '../event-type/event-type.service';
import { GameService } from '../game/game.service';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Round } from '../model/round.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { RoundService } from '../round/round.service';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { EventDto } from './dto/event.dto';
import { EventContext } from './enum/event-context.enum';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;
  let eventTypeServiceMock: MockType<EventTypeService>;
  let repositoryMock: MockType<Repository<Event>>;
  let gameRepositoryMock: MockType<Repository<Game>>;
  let roundRepositoryMock: MockType<Repository<Round>>;

  const eventTypeMockFactory: () => MockType<EventTypeService> = jest.fn(() => ({
    findOne: jest.fn(),
    findValidPenalty: jest.fn(),
  }));

  const repositoryMockFactory: () => MockType<Repository<Event>> = jest.fn(() => ({
    findOne: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    countBy: jest.fn(),
  }));

  const gameRepositoryMockFactory: () => MockType<Repository<Game>> = jest.fn(() => ({
    findOneOrFail: jest.fn(),
  }));

  const roundRepositoryMockFactory: () => MockType<Repository<Round>> = jest.fn(() => ({
    findOneOrFail: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        GameService,
        RoundService,
        { provide: EventTypeService, useFactory: eventTypeMockFactory },
        { provide: getRepositoryToken(Event), useFactory: repositoryMockFactory },
        { provide: getRepositoryToken(Game), useFactory: gameRepositoryMockFactory },
        { provide: getRepositoryToken(Round), useFactory: roundRepositoryMockFactory },
      ],
    }).compile();

    service = module.get(EventService);
    eventTypeServiceMock = module.get(EventTypeService);
    repositoryMock = module.get(getRepositoryToken(Event));
    gameRepositoryMock = module.get(getRepositoryToken(Game));
    roundRepositoryMock = module.get(getRepositoryToken(Round));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new entity with context GAME successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.countBy.mockReturnValue(Promise.resolve(5));

      gameRepositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(TestData.game()));

      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result.event).toEqual(EventDto.fromEntity(entity));
      expect(result.celebration).toBeNull();
      expect(result.warning).toBeUndefined();
      expect(eventTypeServiceMock.findValidPenalty).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ penaltyValue: 0.5 }));
      expect(repositoryMock.countBy).toHaveBeenCalledTimes(1);
    });

    it('should create a new entity with context ROUND successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.countBy.mockReturnValue(Promise.resolve(5));

      const mockRound =  { ...TestData.round(), game: { createDateTime: new Date(), lastChangedDateTime: new Date(), datetime: new Date() } };
      roundRepositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(mockRound));

      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO }));

      const result = await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result.event).toEqual(EventDto.fromEntity(entity));
      expect(result.celebration).toBeNull();
      expect(result.warning).toBeUndefined();
      expect(eventTypeServiceMock.findValidPenalty).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ penaltyValue: 0.5 }));
      expect(repositoryMock.countBy).toHaveBeenCalledTimes(1);
    });

    it('should create a new entity with context GAME and warning successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.countBy.mockReturnValue(Promise.resolve(5));

      gameRepositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(TestData.game()));

      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.8, penaltyUnit: PenaltyUnit.EURO, warning: 'some warning' }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result.event).toEqual(EventDto.fromEntity(entity));
      expect(result.celebration).toBeNull();
      expect(result.warning).toEqual('some warning');
      expect(eventTypeServiceMock.findValidPenalty).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ penaltyValue: 0.8 }));
      expect(repositoryMock.countBy).toHaveBeenCalledTimes(1);
    });

    it('should create a new entity with context GAME and celebration successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.countBy.mockReturnValue(Promise.resolve(100));

      gameRepositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(TestData.game()));

      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO }));
      eventTypeServiceMock.findOne.mockReturnValue(of({ description: 'some event' }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result.event).toEqual(EventDto.fromEntity(entity));
      expect(result.celebration).toEqual({ label: 'some event', count: 100 });
      expect(result.warning).toBeUndefined();
      expect(eventTypeServiceMock.findValidPenalty).toHaveBeenCalledTimes(1);
      expect(eventTypeServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ penaltyValue: 0.5 }));
      expect(repositoryMock.countBy).toHaveBeenCalledTimes(1);
    });

    it('should fail if game not found', async () => {
      gameRepositoryMock.findOneOrFail.mockImplementation(() => Promise.reject('Not found'));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }))).rejects.toEqual(`Not found`);
    });

    it('should fail if round not found', async () => {
      roundRepositoryMock.findOneOrFail.mockImplementation(() => Promise.reject('Not found'));

      await expect(firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }))).rejects.toEqual(`Not found`);
    });

    it('should fail if event type not found', async () => {
      eventTypeServiceMock.findValidPenalty.mockImplementation(() => throwError(() => 'Not found'));

      const mockRound =  { ...TestData.round(), game: { createDateTime: new Date(), lastChangedDateTime: new Date(), datetime: new Date() } };
      roundRepositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(mockRound));

      await expect(firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }))).rejects.toEqual(`Not found`);
    });
  });

  it('should find one entity', async () => {
    const entity = TestData.gameEvent();
    repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.findOne(entity.id));
    expect(result).toEqual(EventDto.fromEntity(entity));
    expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
  });

  it('should find all entities', async () => {
    const entity1 = TestData.gameEvent();
    const entity2 = TestData.roundEvent();
    repositoryMock.find.mockReturnValue(Promise.resolve([entity1, entity2]));

    const result = await firstValueFrom(service.findAll());
    expect(result).toEqual(EventDto.fromEntities([entity1, entity2]));
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  describe('update', () => {
    it('should fail on event not found by id', async () => {
      repositoryMock.findOne.mockReturnValue(Promise.resolve( null));
      repositoryMock.preload.mockReturnValue(Promise.resolve(null));
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }))).rejects.toThrowError(/Not Found/);
    });

    it('should update an entity successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOne.mockReturnValue(Promise.resolve( entity))
      repositoryMock.preload.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.update(entity.id, { gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result).toEqual(EventDto.fromEntity(entity));
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.preload).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should fail on entity not found by id', async () => {
      repositoryMock.findOneByOrFail.mockReturnValue(Promise.reject('error'));

      await expect(firstValueFrom(service.remove(RANDOM_UUID()))).rejects.toEqual('error');
      expect(repositoryMock.findOneByOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should remove an entity successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOneByOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.remove.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.remove(entity.id));
      expect(result).toEqual(entity.id);
      expect(repositoryMock.findOneByOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.remove).toHaveBeenCalledTimes(1);
    });
  });
});
