import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../model/player.entity';
import { PlayerService } from './player.service';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

describe('PlayerService', () => {
  let service: PlayerService;
  let repositoryMock: MockType<Repository<PlayerEntity>>;

  const repositoryMockFactory: () => MockType<Repository<PlayerEntity>> = jest.fn(() => ({
    find: jest.fn(entity => entity),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerService,
        { provide: getRepositoryToken(PlayerEntity), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get(PlayerService);
    repositoryMock = module.get(getRepositoryToken(PlayerEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a user', async () => {
    const user = {name: 'Alni', id: '123'};
    repositoryMock.find.mockReturnValue([user]);

    service.getAll().subscribe(response => {
      expect(response).toEqual(user);
      expect(repositoryMock.find).toHaveBeenCalled();
    });
  });
});
