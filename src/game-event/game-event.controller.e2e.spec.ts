import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { RANDOM_STRING, RANDOM_UUID } from '../test.utils';
import { GameEventController } from './game-event.controller';
import { GameEventService } from './game-event.service';

describe('GameEventController e2e', () => {
  let app: INestApplication;
  const gameEventService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GameEventController],
      providers: [
        GameEventService
      ]
    })
      .overrideProvider(GameEventService)
      .useValue(gameEventService)
      .compile();

    app = moduleRef.createNestApplication().useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create', () => {
    it.each([
      [null, 400, ['gameId must be a UUID', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ multiplicatorValue: RANDOM_STRING(33), comment: RANDOM_STRING(129) }, 400, ['multiplicatorValue must be shorter than or equal to 32 characters', 'comment must be shorter than or equal to 128 characters', 'gameId must be a UUID', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ multiplicatorValue: RANDOM_STRING(32), comment: RANDOM_STRING(128), gameId: 'invalid-uuid', playerId: 'invalid-uuid', eventTypeId: 'invalid-uuid' }, 400, ['gameId must be a UUID', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ multiplicatorValue: RANDOM_STRING(32), comment: RANDOM_STRING(128), gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 201, undefined],
      [{ gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 201, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).post('/game-event').send(body);
      } else {
        response = await request(app.getHttpServer()).post('/game-event');
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('get', () => {
    it.each([
      [200, undefined],
    ])('findOne request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/game-event/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });

    it.each([
      [200, undefined],
    ])('findAll request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/game-event`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('update', () => {
    it.each([
      [null, 200, undefined],
      [{ multiplicatorValue: RANDOM_STRING(33), comment: RANDOM_STRING(129) }, 400, ['multiplicatorValue must be shorter than or equal to 32 characters', 'comment must be shorter than or equal to 128 characters']],
      [{ multiplicatorValue: RANDOM_STRING(32), comment: RANDOM_STRING(128), gameId: 'invalid-uuid', playerId: 'invalid-uuid', eventTypeId: 'invalid-uuid' }, 400, ['gameId must be a UUID', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ multiplicatorValue: RANDOM_STRING(32), comment: RANDOM_STRING(128), gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 200, undefined],
      [{ gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 200, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/game-event/${RANDOM_UUID()}`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/game-event/${RANDOM_UUID()}`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('delete', () => {
    it.each([
      [200, undefined],
    ])('request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/game-event/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
