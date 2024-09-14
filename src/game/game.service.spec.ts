import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Game } from '../model/game.entity';
import { MockType, RANDOM_UUID, TestData } from '../test.utils';
import { GameDto } from './dto/game.dto';
import { PlaceType } from './enum/place-type.enum';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;
  let repositoryMock: MockType<Repository<Game>>;

  const repositoryMockFactory: () => MockType<Repository<Game>> = jest.fn(() => ({
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: getRepositoryToken(Game), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(GameService);
    repositoryMock = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new entity successfully', async () => {
      const entity = TestData.game();
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.create({ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }));
      expect(result).toEqual(GameDto.fromEntity(entity));
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  it('should find one entity', async () => {
    const entity = TestData.game();
    repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve(entity));

    const result = await firstValueFrom(service.findOne(entity.id));
    expect(result).toEqual(GameDto.fromEntity(entity));
    expect(repositoryMock.findOneOrFail).toHaveBeenCalledTimes(1);
  });

  it('should find all entities', async () => {
    const entity = TestData.game();
    repositoryMock.find.mockReturnValue(Promise.resolve([entity]));

    const result = await firstValueFrom(service.findAll());
    expect(result).toEqual(GameDto.fromEntities([entity]));
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  describe('update', () => {
    it('should fail on entity not found by id', async () => {
      repositoryMock.findOne.mockReturnValue(Promise.resolve( null));
      repositoryMock.preload.mockReturnValue(Promise.resolve(null));
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }))).rejects.toThrowError(/Not Found/);
    });

    it('should update an entity successfully', async () => {
      const entity = TestData.game();
      repositoryMock.findOneOrFail.mockReturnValue(Promise.resolve( entity))
      repositoryMock.preload.mockReturnValue(Promise.resolve(entity));
      repositoryMock.save.mockReturnValue(Promise.resolve(entity));

      const result = await firstValueFrom(service.update(entity.id, { placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere' }));
      expect(result).toEqual(GameDto.fromEntity(entity));
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
