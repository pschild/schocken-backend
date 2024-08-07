import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { RANDOM_STRING } from '../test.utils';
import { GameController } from './game.controller';
import { GameService } from './game.service';

describe('GameController e2e', () => {
  let app: INestApplication;
  const gameService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        GameService,
      ]
    })
      .overrideProvider(GameService)
      .useValue(gameService)
      .compile();

    app = moduleRef.createNestApplication().useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    [null,                                                                  201, undefined],
    [{},                                                                    201, undefined],
    [{ placeOfAwayGame: RANDOM_STRING(64) },                         201, undefined],
    [{ placeOfAwayGame: RANDOM_STRING(65) },                         400, ['placeOfAwayGame must be shorter than or equal to 64 characters']],
  ])('create request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
    let response;
    if (body) {
      response = await request(app.getHttpServer()).post('/game').send(body);
    } else {
      response = await request(app.getHttpServer()).post('/game');
    }
    expect(response.status).toEqual(status);
    expect(response.body.message).toEqual(errors);
  });
});
