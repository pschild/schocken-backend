import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { GameEvent } from '../model/game-event.entity';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { GameEventDto } from './dto/game-event.dto';
import { GameEventService } from './game-event.service';

describe('GameEventService', () => {
  let service: GameEventService;
  let repositoryMock: MockType<Repository<GameEvent>>;

  const repositoryMockFactory: () => MockType<Repository<GameEvent>> = jest.fn(() => ({
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
        GameEventService,
        { provide: getRepositoryToken(GameEvent), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(GameEventService);
    repositoryMock = module.get(getRepositoryToken(GameEvent));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new entity successfully', async () => {
      const entity = TestData.gameEvent();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.create({ gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }));
      expect(result).toEqual(GameEventDto.fromEntity(entity));
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  it('should find one entity', async () => {
    const entity = TestData.gameEvent();
    repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.findOne(entity.id));
    expect(result).toEqual(GameEventDto.fromEntity(entity));
    expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
  });

  it('should find all entities', async () => {
    const entity = TestData.gameEvent();
    repositoryMock.find.mockReturnValue(Promise.resolve([entity]));

    const result = await firstValueFrom(service.findAll());
    expect(result).toEqual(GameEventDto.fromEntities([entity]));
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  describe('update', () => {
    it('should fail on game event not found by id', async () => {
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
      expect(result).toEqual(GameEventDto.fromEntity(entity));
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
