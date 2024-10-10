import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Round } from '../model/round.entity';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { RoundService } from './round.service';

describe('RoundService', () => {
  let service: RoundService;
  let repositoryMock: MockType<Repository<Round>>;

  const repositoryMockFactory: () => MockType<Repository<Round>> = jest.fn(() => ({
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundService,
        { provide: getRepositoryToken(Round), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(RoundService);
    repositoryMock = module.get(getRepositoryToken(Round));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new entity successfully', async () => {
      const entity = TestData.round();
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.count.mockReturnValue(Promise.resolve(42));

      const result = await firstValueFrom(service.create({ gameId: RANDOM_UUID() }));
      expect(result.round).toEqual(entity);
      expect(result.celebration).toBeNull();
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.count).toHaveBeenCalledTimes(1);
    });

    it('should create a new entity with celebration successfully', async () => {
      const entity = TestData.round();
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.count.mockReturnValue(Promise.resolve(100));

      const result = await firstValueFrom(service.create({ gameId: RANDOM_UUID() }));
      expect(result.round).toEqual(entity);
      expect(result.celebration).toEqual({ label: 'Runden', count: 100 });
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.count).toHaveBeenCalledTimes(1);
    });
  });

  it('should find one entity', async () => {
    const entity = TestData.round();
    repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.findOne(entity.id));
    expect(result).toEqual(entity);
    expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
  });

  it('should find all entities', async () => {
    const entity = TestData.round();
    repositoryMock.find.mockReturnValue(Promise.resolve([entity]));

    const result = await firstValueFrom(service.findAll());
    expect(result).toEqual([entity]);
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  describe('update', () => {
    it('should fail on entity not found by id', async () => {
      repositoryMock.findOne.mockReturnValue(Promise.resolve( null));
      repositoryMock.preload.mockReturnValue(Promise.resolve(null));
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { gameId: RANDOM_UUID() }))).rejects.toThrowError(/Not Found/);
    });

    it('should update an entity successfully', async () => {
      const entity = TestData.round();
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve( entity))
      repositoryMock.preload.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.update(entity.id, { gameId: RANDOM_UUID() }));
      expect(result).toEqual(entity);
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
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
      const entity = TestData.round();
      repositoryMock.findOneByOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.remove.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.remove(entity.id));
      expect(result).toEqual(entity.id);
      expect(repositoryMock.findOneByOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.remove).toHaveBeenCalledTimes(1);
    });
  });

  it('should update attendees', async () => {
    const entity = TestData.round();
    const dto = { playerIds: [RANDOM_UUID(), RANDOM_UUID()] };
    repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
    repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
    repositoryMock.save.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.updateAttendees(RANDOM_UUID(), dto));
    expect(result).toEqual(entity);
    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
  });

  it('should add finalist', async () => {
    const entity = TestData.round();
    repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
    repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
    repositoryMock.save.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.addFinalist(RANDOM_UUID(), RANDOM_UUID()));
    expect(result).toEqual(entity);
    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
  });

  it('should remove finalist', async () => {
    const entity = TestData.round();
    repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
    repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
    repositoryMock.save.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.removeFinalist(RANDOM_UUID(), RANDOM_UUID()));
    expect(result).toEqual(entity);
    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
  });
});
