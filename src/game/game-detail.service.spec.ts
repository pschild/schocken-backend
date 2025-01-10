import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Game } from '../model/game.entity';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { PlaceType } from './enum/place-type.enum';
import { GameDetailService } from './game-detail.service';

describe('GameDetailService', () => {
  let service: GameDetailService;
  let repositoryMock: MockType<Repository<Game>>;

  const repositoryMockFactory: () => MockType<Repository<Game>> = jest.fn(() => ({
    findOne: jest.fn(),
    findOneByOrFail: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameDetailService,
        { provide: getRepositoryToken(Game), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(GameDetailService);
    repositoryMock = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new entity successfully', async () => {
      const entity = TestData.game();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.create({ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }));
      expect(result).toEqual(entity);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('query', () => {
    it('should find one entity', async () => {
      const entity = TestData.game();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.findOne(entity.id));
      expect(result).toEqual(entity);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('should get datetime of game', async () => {
      const entity = TestData.game();
      repositoryMock.findOne.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.getDatetime(entity.id));
      expect(result).toEqual(entity.datetime);
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should fail on entity not found by id', async () => {
      repositoryMock.findOne.mockReturnValue(Promise.resolve( null));
      repositoryMock.preload.mockReturnValue(Promise.resolve(null));
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }))).rejects.toThrowError(/Not Found/);
    });

    it('should update an entity successfully', async () => {
      const entity = TestData.game();
      repositoryMock.findOne.mockReturnValue(Promise.resolve( entity))
      repositoryMock.preload.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.update(entity.id, { placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }));
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
      expect(repositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should remove an entity successfully', async () => {
      const entity = TestData.game();
      repositoryMock.findOneByOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.remove.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.remove(entity.id));
      expect(result).toEqual(entity.id);
      expect(repositoryMock.findOneByOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.remove).toHaveBeenCalledTimes(1);
    });
  });
});
