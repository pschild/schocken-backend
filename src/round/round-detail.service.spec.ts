import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Round } from '../model/round.entity';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { RoundDetailService } from './round-detail.service';

describe('RoundDetailService', () => {
  let service: RoundDetailService;
  let repositoryMock: MockType<Repository<Round>>;

  const repositoryMockFactory: () => MockType<Repository<Round>> = jest.fn(() => ({
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundDetailService,
        { provide: getRepositoryToken(Round), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(RoundDetailService);
    repositoryMock = module.get(getRepositoryToken(Round));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new entity successfully', async () => {
      const entity = TestData.round();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.count.mockReturnValue(Promise.resolve(42));

      const result = await firstValueFrom(service.create({ gameId: RANDOM_UUID() }));
      expect(result.round).toEqual(entity);
      expect(result.celebration).toBeNull();
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.count).toHaveBeenCalledTimes(1);
    });

    it('should create a new entity with celebration successfully', async () => {
      const entity = TestData.round();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      repositoryMock.count.mockReturnValue(Promise.resolve(100));

      const result = await firstValueFrom(service.create({ gameId: RANDOM_UUID() }));
      expect(result.round).toEqual(entity);
      expect(result.celebration).toEqual({ label: 'Runden', count: 100 });
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('query', () => {
    it('should find one entity', async () => {
      const entity = TestData.round();
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.findOne(entity.id));
      expect(result).toEqual(entity);
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
    });

    it('should get datetime of game of round', async () => {
      const entity = { ...TestData.round(), game: TestData.game() };
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.getGameDatetime(entity.id));
      expect(result).toEqual(entity.datetime);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('should find rounds by gameId', async () => {
      const rounds = [TestData.round(), TestData.round(), TestData.round()];
      repositoryMock.find.mockReturnValue(Promise.resolve(rounds));

      const result = await firstValueFrom(service.findByGameId(RANDOM_UUID()));
      expect(result).toEqual(rounds);
      expect(repositoryMock.find).toHaveBeenCalledTimes(1);
    });

    it('should find rounds by gameId', async () => {
      const entity = TestData.round();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.getDetails(entity.id));
      expect(result).toEqual(entity);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
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

    it('should update finalists', async () => {
      const entity = TestData.round();
      const dto = { playerIds: [RANDOM_UUID(), RANDOM_UUID()] };
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));
      const result = await firstValueFrom(service.updateFinalists(RANDOM_UUID(), dto));
      expect(result).toEqual(entity);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
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
});
