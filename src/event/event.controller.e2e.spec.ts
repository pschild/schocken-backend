import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import * as request from 'supertest';
import { RANDOM_STRING, RANDOM_UUID } from '../test.utils';
import { EventContext } from './enum/event-context.enum';
import { EventController } from './event.controller';
import { EventService } from './event.service';

describe('EventController e2e', () => {
  let app: INestApplication;
  const eventService = {
    create: jest.fn(() => of({})),
    findOne: jest.fn(() => of(null)),
    findAll: jest.fn(() => of([])),
    update: jest.fn(() => of(null)),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        EventService
      ]
    })
      .overrideProvider(EventService)
      .useValue(eventService)
      .compile();

    app = moduleRef.createNestApplication().useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create', () => {
    it.each([
      [null, 400, ['context is not valid in combination with gameId, roundId', 'context must be one of the following values: GAME, ROUND', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ multiplicatorValue: -1, comment: RANDOM_STRING(129) }, 400, ['multiplicatorValue must not be less than 1', 'comment must be shorter than or equal to 128 characters', 'context is not valid in combination with gameId, roundId', 'context must be one of the following values: GAME, ROUND', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ multiplicatorValue: 10, comment: RANDOM_STRING(128), context: 'invalid' }, 400, ['context is not valid in combination with gameId, roundId', 'context must be one of the following values: GAME, ROUND', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ multiplicatorValue: 10, comment: RANDOM_STRING(128), context: EventContext.GAME, gameId: 'invalid-uuid', playerId: 'invalid-uuid', eventTypeId: 'invalid-uuid' }, 400, ['gameId must be a UUID', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ context: EventContext.GAME, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 400, ['context is not valid in combination with gameId, roundId']],
      [{ context: EventContext.ROUND, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 400, ['context is not valid in combination with gameId, roundId']],
      [{ context: EventContext.GAME, gameId: RANDOM_UUID(), roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 400, ['only one property of [gameId, roundId] can be defined simultaneously', 'only one property of [roundId, gameId] can be defined simultaneously']],
      [{ context: EventContext.ROUND, gameId: RANDOM_UUID(), roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 400, ['only one property of [gameId, roundId] can be defined simultaneously', 'only one property of [roundId, gameId] can be defined simultaneously']],
      [{ comment: RANDOM_STRING(128), context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 201, undefined],
      [{ comment: RANDOM_STRING(128), context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 201, undefined],
      [{ context: EventContext.GAME, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 201, undefined],
      [{ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 201, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).post('/event').send(body);
      } else {
        response = await request(app.getHttpServer()).post('/event');
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('get', () => {
    it.each([
      [200, undefined],
    ])('findOne request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/event/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });

    it.each([
      [200, undefined],
    ])('findAll request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/event`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('update', () => {
    it.each([
      [null, 200, undefined],
      [{ multiplicatorValue: -1, comment: RANDOM_STRING(129) }, 400, ['multiplicatorValue must not be less than 1', 'comment must be shorter than or equal to 128 characters']],
      [{ multiplicatorValue: 10, comment: RANDOM_STRING(128), context: 'invalid', gameId: 'invalid-uuid', playerId: 'invalid-uuid', eventTypeId: 'invalid-uuid' }, 400, ['context is not valid in combination with gameId, roundId', 'context must be one of the following values: GAME, ROUND', 'gameId must be a UUID', 'playerId must be a UUID', 'eventTypeId must be a UUID']],
      [{ context: EventContext.GAME, roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 400, ['context is not valid in combination with gameId, roundId']],
      [{ context: EventContext.ROUND, gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 400, ['context is not valid in combination with gameId, roundId']],
      [{ gameId: RANDOM_UUID(), roundId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 400, ['only one property of [gameId, roundId] can be defined simultaneously', 'only one property of [roundId, gameId] can be defined simultaneously']],
      [{ comment: RANDOM_STRING(128), gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 200, undefined],
      [{ gameId: RANDOM_UUID(), playerId: RANDOM_UUID(), eventTypeId: RANDOM_UUID() }, 200, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/event/${RANDOM_UUID()}`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/event/${RANDOM_UUID()}`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('delete', () => {
    it.each([
      [200, undefined],
    ])('request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/event/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
