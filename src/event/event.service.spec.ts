import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom, of } from 'rxjs';
import { Repository } from 'typeorm';
import { EventTypeService } from '../event-type/event-type.service';
import { Event } from '../model/event.entity';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { EventDto } from './dto/event.dto';
import { EventContext } from './enum/event-context.enum';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;
  let eventTypeServiceMock: MockType<EventTypeService>;
  let repositoryMock: MockType<Repository<Event>>;

  const eventTypeMockFactory: () => MockType<EventTypeService> = jest.fn(() => ({
    findOne: jest.fn(),
  }));

  const repositoryMockFactory: () => MockType<Repository<Event>> = jest.fn(() => ({
    findOne: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: EventTypeService, useFactory: eventTypeMockFactory },
        { provide: getRepositoryToken(Event), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(EventService);
    eventTypeServiceMock = module.get(EventTypeService);
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

      eventTypeServiceMock.findOne.mockReturnValue(of(TestData.eventType()));

      const result = await firstValueFrom(service.create({ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result).toEqual(EventDto.fromEntity(entity));
      expect(eventTypeServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ penaltyValue: 0.5 }));
    });

    it('should create a new entity with context ROUND successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      eventTypeServiceMock.findOne.mockReturnValue(of(TestData.eventType()));

      const result = await firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result).toEqual(EventDto.fromEntity(entity));
      expect(eventTypeServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ penaltyValue: 0.5 }));
    });

    it('should fail if event type not found', async () => {
      eventTypeServiceMock.findOne.mockReturnValue(of(null));
      await expect(firstValueFrom(service.create({ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }))).rejects.toThrowError(/Could not find event type with id/);
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
