import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { EventType } from '../model/event-type.entity';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { EventTypeDto } from './dto/event-type.dto';
import { EventTypeContext } from './enum/event-type-context.enum';
import { EventTypeService } from './event-type.service';

describe('EventTypeService', () => {
  let service: EventTypeService;
  let repositoryMock: MockType<Repository<EventType>>;

  const repositoryMockFactory: () => MockType<Repository<EventType>> = jest.fn(() => ({
    findOne: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    softRemove: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventTypeService,
        { provide: getRepositoryToken(EventType), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(EventTypeService);
    repositoryMock = module.get(getRepositoryToken(EventType));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new entity successfully', async () => {
      const entity = TestData.eventType();
      repositoryMock.findOne.mockReturnValueOnce(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.create({ context: EventTypeContext.GAME, description: 'some event' }));
      expect(result).toEqual(entity);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  it('should find one entity', async () => {
    const entity = TestData.eventType();
    repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.findOne(entity.id));
    expect(result).toEqual(entity);
    expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
  });

  it('should find all entities', async () => {
    const entity = TestData.eventType();
    repositoryMock.find.mockReturnValue(Promise.resolve([entity]));

    const result = await firstValueFrom(service.findAll());
    expect(result).toEqual([entity]);
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  describe('update', () => {
    it('should fail on entity not found by id', async () => {
      repositoryMock.findOne.mockReturnValue(Promise.resolve( null));
      repositoryMock.preload.mockReturnValue(Promise.resolve(null));
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { context: EventTypeContext.GAME, description: 'some event' }))).rejects.toThrowError(/Not Found/);
    });

    it('should update an entity successfully', async () => {
      const entity = TestData.eventType();
      repositoryMock.findOne.mockReturnValue(Promise.resolve( entity));
      repositoryMock.preload.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.update(entity.id, { context: EventTypeContext.GAME, description: 'some event' }));
      expect(result).toEqual(entity);
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
      expect(repositoryMock.softRemove).not.toHaveBeenCalled();
    });

    it('should remove an entity successfully', async () => {
      const entity = TestData.eventType();
      repositoryMock.findOneByOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.softRemove.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.remove(entity.id));
      expect(result).toEqual(entity.id);
      expect(repositoryMock.findOneByOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.softRemove).toHaveBeenCalledTimes(1);
    });
  });
});
