import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { of } from 'rxjs';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

describe('PlayerController', () => {
  let controller: PlayerController;
  const playerService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        { provide: PlayerService, useValue: playerService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: { warn: jest.fn() } }
      ]
    }).compile();

    controller = module.get<PlayerController>(PlayerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service', () => {
    jest.spyOn(playerService, 'create').mockReturnValue(of(null));
    jest.spyOn(playerService, 'findAll').mockReturnValue(of([]));

    controller.create(null);
    expect(playerService.create).toHaveBeenCalled();

    controller.findAll();
    expect(playerService.findAll).toHaveBeenCalled();
  });
});
