import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

describe('PlayerController', () => {
  let controller: PlayerController;
  const playerService = {
    getAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        { provide: PlayerService, useValue: playerService }
      ]
    }).compile();

    controller = module.get<PlayerController>(PlayerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service', () => {
    jest.spyOn(playerService, 'create').mockReturnValue(of(null));
    jest.spyOn(playerService, 'getAll').mockReturnValue(of([]));

    controller.create(null);
    expect(playerService.create).toHaveBeenCalled();

    controller.getAll();
    expect(playerService.getAll).toHaveBeenCalled();
  });
});
