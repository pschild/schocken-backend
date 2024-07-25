import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

/**
 * Blueprint for how to test a controller with fake http requests.
 */
describe('PlayerController e2e', () => {
  let app: INestApplication;
  const playerService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [PlayerService]
    })
      .overrideProvider(PlayerService)
      .useValue(playerService)
      .compile();

    app = moduleRef.createNestApplication().useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    [null,                                                                  400, ['name must be a string']],
    [{ name: 'Susi' },                                                      201, undefined],
    [{ name: 'Susi', registered: new Date().toISOString(), active: false }, 201, undefined],
  ])('create request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
    let response;
    if (body) {
      response = await request(app.getHttpServer()).post('/player').send(body);
    } else {
      response = await request(app.getHttpServer()).post('/player');
    }
    expect(response.status).toEqual(status);
    expect(response.body.message).toEqual(errors);
  });
});
