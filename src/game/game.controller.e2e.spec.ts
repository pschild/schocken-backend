import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { RANDOM_STRING, RANDOM_UUID } from '../test.utils';
import { PlaceType } from './enum/place-type.enum';
import { GameController } from './game.controller';
import { GameService } from './game.service';

describe('GameController e2e', () => {
  let app: INestApplication;
  const gameService = {
    create: jest.fn(),
    update: jest.fn(),
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
    [null, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame', 'placeType must be one of the following values: HOME, AWAY, REMOTE']],
    [{}, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame', 'placeType must be one of the following values: HOME, AWAY, REMOTE']],
    [{ placeType: PlaceType.AWAY, placeOfAwayGame: RANDOM_STRING(64) }, 201, undefined],
    [{ placeType: PlaceType.AWAY, placeOfAwayGame: RANDOM_STRING(65) }, 400, ['placeOfAwayGame must be shorter than or equal to 64 characters']],
    [{ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere', hostedById: RANDOM_UUID }, 400, ['only one property of [hostedById, placeOfAwayGame] can be defined simultaneously', 'only one property of [placeOfAwayGame, hostedById] can be defined simultaneously']],
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

  it.each([
    [null, 200, undefined],
    [{}, 200, undefined],
    [{ placeOfAwayGame: RANDOM_STRING(64) }, 200, undefined],
    [{ placeOfAwayGame: RANDOM_STRING(65) }, 400, ['placeOfAwayGame must be shorter than or equal to 64 characters']],
    [{ placeOfAwayGame: 'anywhere', hostedById: RANDOM_UUID }, 400, ['only one property of [hostedById, placeOfAwayGame] can be defined simultaneously', 'only one property of [placeOfAwayGame, hostedById] can be defined simultaneously']],
  ])('update request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
    let response;
    if (body) {
      response = await request(app.getHttpServer()).patch(`/game/${RANDOM_UUID}`).send(body);
    } else {
      response = await request(app.getHttpServer()).patch(`/game/${RANDOM_UUID}`);
    }
    expect(response.status).toEqual(status);
    expect(response.body.message).toEqual(errors);
  });
});
