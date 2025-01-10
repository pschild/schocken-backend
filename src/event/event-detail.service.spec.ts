import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom, of, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { EventTypeService } from '../event-type/event-type.service';
import { GameDetailService } from '../game/game-detail.service';
import { Event } from '../model/event.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { RoundDetailService } from '../round/round-detail.service';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { EventContext } from './enum/event-context.enum';
import { EventDetailService } from './event-detail.service';

describe('EventService', () => {
  let service: EventDetailService;
  let eventTypeServiceMock: MockType<EventTypeService>;
  let gameDetailServiceMock: MockType<GameDetailService>;
  let roundDetailServiceMock: MockType<RoundDetailService>;
  let repositoryMock: MockType<Repository<Event>>;

  const eventTypeMockFactory: () => MockType<EventTypeService> = jest.fn(() => ({
    findOne: jest.fn(),
    findValidPenalty: jest.fn(),
  }));

  const gameDetailServiceMockFactory: () => MockType<GameDetailService> = jest.fn(() => ({
    getDatetime: jest.fn(),
  }));

  const roundDetailServiceMockFactory: () => MockType<RoundDetailService> = jest.fn(() => ({
    getGameDatetime: jest.fn(),
  }));

  const repositoryMockFactory: () => MockType<Repository<Event>> = jest.fn(() => ({
    findOne: jest.fn(),
    findOneByOrFail: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    countBy: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventDetailService,
        { provide: EventTypeService, useFactory: eventTypeMockFactory },
        { provide: GameDetailService, useFactory: gameDetailServiceMockFactory },
        { provide: RoundDetailService, useFactory: roundDetailServiceMockFactory },
        { provide: getRepositoryToken(Event), useFactory: repositoryMockFactory }
      ],
    }).compile();

    service = module.get(EventDetailService);
    eventTypeServiceMock = module.get(EventTypeService);
    gameDetailServiceMock = module.get(GameDetailService);
    roundDetailServiceMock = module.get(RoundDetailService);
    repositoryMock = module.get(getRepositoryToken(Event));
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

      gameDetailServiceMock.getDatetime.mockReturnValue(of(new Date()));
      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result.event).toEqual(entity);
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

      roundDetailServiceMock.getGameDatetime.mockReturnValue(of(new Date()));
      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO }));

      const result = await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result.event).toEqual(entity);
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

      gameDetailServiceMock.getDatetime.mockReturnValue(of(new Date()));
      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.8, penaltyUnit: PenaltyUnit.EURO, warning: 'some warning' }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result.event).toEqual(entity);
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

      gameDetailServiceMock.getDatetime.mockReturnValue(of(new Date()));
      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO }));
      eventTypeServiceMock.findOne.mockReturnValue(of({ description: 'some event' }));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result.event).toEqual(entity);
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
      gameDetailServiceMock.getDatetime.mockImplementation(() => throwError(() => 'Not found'));

      await expect(firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }))).rejects.toEqual(`Not found`);
    });

    it('should fail if round not found', async () => {
      roundDetailServiceMock.getGameDatetime.mockImplementation(() => throwError(() => 'Not found'));

      await expect(firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }))).rejects.toEqual(`Not found`);
    });

    it('should fail if event type not found', async () => {
      eventTypeServiceMock.findValidPenalty.mockImplementation(() => throwError(() => 'Not found'));
      roundDetailServiceMock.getGameDatetime.mockReturnValue(of(new Date()));

      await expect(firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }))).rejects.toEqual(`Not found`);
    });
  });

  describe('bulk create', () => {
    it('should create new entities with context GAME successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.countBy.mockReturnValue(Promise.resolve(5));

      gameDetailServiceMock.getDatetime.mockReturnValue(of(new Date()));
      eventTypeServiceMock.findValidPenalty.mockReturnValue(of({ penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO }));

      const playerIds = [RANDOM_UUID(), RANDOM_UUID(), RANDOM_UUID()];
      const result = await firstValueFrom(service.bulkCreate({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerIds, eventTypeId: RANDOM_UUID() }));
      expect(result.length).toBe(playerIds.length);
      expect(result.every(createdEvent => !!createdEvent.event && createdEvent.celebration === null && !createdEvent.warning))
      expect(eventTypeServiceMock.findValidPenalty).toHaveBeenCalledTimes(playerIds.length);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(playerIds.length);
      expect(repositoryMock.save).toHaveBeenCalledTimes(playerIds.length);
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ penaltyValue: 0.5 }));
      expect(repositoryMock.countBy).toHaveBeenCalledTimes(playerIds.length);
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
