import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Player } from '../model/player.entity';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { PlayerService } from './player.service';

/**
 * Blueprint for how to test a service with a mocked repository.
 */
describe('PlayerService', () => {
  let service: PlayerService;
  let repositoryMock: MockType<Repository<Player>>;

  const repositoryMockFactory: () => MockType<Repository<Player>> = jest.fn(() => ({
    findOneBy: jest.fn(),
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
        PlayerService,
        { provide: getRepositoryToken(Player), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(PlayerService);
    repositoryMock = module.get(getRepositoryToken(Player));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new entity successfully', async () => {
      const entity = TestData.activePlayer();
      repositoryMock.findOneBy.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.create({ name: 'John' }));
      expect(result).toEqual(entity);
      expect(repositoryMock.findOneBy).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  it('should find one entity', async () => {
    const entity = TestData.activePlayer();
    repositoryMock.findOneBy.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.findOne(entity.id));
    expect(result).toEqual(entity);
    expect(repositoryMock.findOneBy).toHaveBeenCalledTimes(1);
  });

  it('should find all entities', async () => {
    const entity = TestData.activePlayer();
    repositoryMock.find.mockReturnValue(Promise.resolve([entity]));

    const result = await firstValueFrom(service.findAll());
    expect(result).toEqual([entity]);
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  describe('update', () => {
    it('should fail on entity not found by id', async () => {
      repositoryMock.findOne.mockReturnValue(Promise.resolve( null));
      repositoryMock.preload.mockReturnValue(Promise.resolve(null));
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { name: 'John' }))).rejects.toThrowError(/Not Found/);
    });

    it('should update an entity successfully', async () => {
      const entity = TestData.activePlayer();
      repositoryMock.findOneBy.mockReturnValue(Promise.resolve( entity))
      repositoryMock.preload.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.update(entity.id, { name: 'John' }));
      expect(result).toEqual(entity);
      expect(repositoryMock.preload).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findOneBy).toHaveBeenCalledTimes(1);
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
      const entity = TestData.activePlayer();
      repositoryMock.findOneByOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.softRemove.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.remove(entity.id));
      expect(result).toEqual(entity.id);
      expect(repositoryMock.findOneByOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.softRemove).toHaveBeenCalledTimes(1);
    });
  });
});
