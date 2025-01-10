import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import * as request from 'supertest';
import { RANDOM_STRING, RANDOM_UUID } from '../test.utils';
import { PlaceType } from './enum/place-type.enum';
import { GameDetailController } from './game-detail.controller';
import { GameDetailService } from './game-detail.service';

describe('GameDetailController e2e', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(() => of(null)),
    findOne: jest.fn(() => of(null)),
    update: jest.fn(() => of(null)),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GameDetailController],
      providers: [
        GameDetailService,
      ]
    })
      .overrideProvider(GameDetailService)
      .useValue(service)
      .compile();

    app = moduleRef.createNestApplication().useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create', () => {
    it.each([
      [null, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame', 'placeType must be one of the following values: HOME, AWAY, REMOTE']],
      [{}, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame', 'placeType must be one of the following values: HOME, AWAY, REMOTE']],
      [{ placeType: 'invalid-value' }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame', 'placeType must be one of the following values: HOME, AWAY, REMOTE']],
      [{ placeType: PlaceType.AWAY, placeOfAwayGame: RANDOM_STRING(64), hostedById: null }, 201, undefined],
      [{ placeType: PlaceType.AWAY, placeOfAwayGame: RANDOM_STRING(65) }, 400, ['placeOfAwayGame must be shorter than or equal to 64 characters']],
      [{ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere', hostedById: RANDOM_UUID() }, 400, ['only one property of [hostedById, placeOfAwayGame] can be defined simultaneously', 'only one property of [placeOfAwayGame, hostedById] can be defined simultaneously']],
      [{ placeType: PlaceType.AWAY, hostedById: RANDOM_UUID() }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame']],
      [{ placeType: PlaceType.HOME, placeOfAwayGame: null, hostedById: RANDOM_UUID() }, 201, undefined],
      [{ placeType: PlaceType.HOME, hostedById: 'invalid-uuid' }, 400, ['hostedById must be a UUID']],
      [{ placeType: PlaceType.HOME, placeOfAwayGame: 'anywhere' }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame']],
      [{ placeType: PlaceType.REMOTE, placeOfAwayGame: 'anywhere' }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame']],
      [{ placeType: PlaceType.REMOTE, hostedById: RANDOM_UUID() }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame']],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).post('/game-details').send(body);
      } else {
        response = await request(app.getHttpServer()).post('/game-details');
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('get', () => {
    it.each([
      [200, undefined],
    ])('findOne request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/game-details/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('update', () => {
    it.each([
      [null, 200, undefined],
      [{}, 200, undefined],
      [{ placeType: 'invalid-value' }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame', 'placeType must be one of the following values: HOME, AWAY, REMOTE']],
      [{ placeType: PlaceType.AWAY, placeOfAwayGame: RANDOM_STRING(64), hostedById: null }, 200, undefined],
      [{ placeType: PlaceType.AWAY, placeOfAwayGame: RANDOM_STRING(65) }, 400, ['placeOfAwayGame must be shorter than or equal to 64 characters']],
      [{ placeType: PlaceType.AWAY, placeOfAwayGame: 'anywhere', hostedById: RANDOM_UUID() }, 400, ['only one property of [hostedById, placeOfAwayGame] can be defined simultaneously', 'only one property of [placeOfAwayGame, hostedById] can be defined simultaneously']],
      [{ placeType: PlaceType.AWAY, hostedById: RANDOM_UUID() }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame']],
      [{ placeType: PlaceType.HOME, placeOfAwayGame: null, hostedById: RANDOM_UUID() }, 200, undefined],
      [{ placeType: PlaceType.HOME, hostedById: 'invalid-uuid' }, 400, ['hostedById must be a UUID']],
      [{ placeType: PlaceType.HOME, placeOfAwayGame: 'anywhere' }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame']],
      [{ placeType: PlaceType.REMOTE, placeOfAwayGame: 'anywhere' }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame']],
      [{ placeType: PlaceType.REMOTE, hostedById: RANDOM_UUID() }, 400, ['placeType is not valid in combination with hostedById, placeOfAwayGame']],
    ])('update request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/game-details/${RANDOM_UUID()}`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/game-details/${RANDOM_UUID()}`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('delete', () => {
    it.each([
      [200, undefined],
    ])('request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/game-details/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
