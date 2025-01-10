import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import * as request from 'supertest';
import { RANDOM_STRING, RANDOM_UUID } from '../test.utils';
import { EventContext } from './enum/event-context.enum';
import { EventDetailController } from './event-detail.controller';
import { EventDetailService } from './event-detail.service';

describe('EventDetailController e2e', () => {
  let app: INestApplication;
  const eventDetailService = {
    create: jest.fn(() => of({})),
    bulkCreate: jest.fn(() => of([])),
    findOne: jest.fn(() => of(null)),
    findOneByOrFail: jest.fn(() => of(null)),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventDetailController],
      providers: [
        EventDetailService
      ]
    })
      .overrideProvider(EventDetailService)
      .useValue(eventDetailService)
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
        response = await request(app.getHttpServer()).post('/event-details').send(body);
      } else {
        response = await request(app.getHttpServer()).post('/event-details');
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });

    it.each([
      [null, 400, ['context is not valid in combination with gameId, roundId', 'context must be one of the following values: GAME, ROUND', 'each value in playerIds must be a UUID', 'playerIds must be an array', 'eventTypeId must be a UUID']],
      [{ context: 'invalid' }, 400, ['context is not valid in combination with gameId, roundId', 'context must be one of the following values: GAME, ROUND', 'each value in playerIds must be a UUID', 'playerIds must be an array', 'eventTypeId must be a UUID']],
      [{ context: EventContext.GAME, gameId: 'invalid-uuid', playerIds: ['invalid-uuid'], eventTypeId: 'invalid-uuid' }, 400, ['gameId must be a UUID', 'each value in playerIds must be a UUID', 'eventTypeId must be a UUID']],
      [{ context: EventContext.GAME, roundId: RANDOM_UUID(), playerIds: [RANDOM_UUID(), RANDOM_UUID()], eventTypeId: RANDOM_UUID() }, 400, ['context is not valid in combination with gameId, roundId']],
      [{ context: EventContext.ROUND, gameId: RANDOM_UUID(), playerIds: [RANDOM_UUID(), RANDOM_UUID()], eventTypeId: RANDOM_UUID() }, 400, ['context is not valid in combination with gameId, roundId']],
      [{ context: EventContext.GAME, gameId: RANDOM_UUID(), roundId: RANDOM_UUID(), playerIds: [RANDOM_UUID(), RANDOM_UUID()], eventTypeId: RANDOM_UUID() }, 400, ['only one property of [gameId, roundId] can be defined simultaneously', 'only one property of [roundId, gameId] can be defined simultaneously']],
      [{ context: EventContext.ROUND, gameId: RANDOM_UUID(), roundId: RANDOM_UUID(), playerIds: [RANDOM_UUID(), RANDOM_UUID()], eventTypeId: RANDOM_UUID() }, 400, ['only one property of [gameId, roundId] can be defined simultaneously', 'only one property of [roundId, gameId] can be defined simultaneously']],
      [{ context: EventContext.GAME, gameId: RANDOM_UUID(), playerIds: [RANDOM_UUID(), RANDOM_UUID()], eventTypeId: RANDOM_UUID() }, 201, undefined],
      [{ context: EventContext.ROUND, roundId: RANDOM_UUID(), playerIds: [RANDOM_UUID(), RANDOM_UUID()], eventTypeId: RANDOM_UUID() }, 201, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).post('/event-details/bulk').send(body);
      } else {
        response = await request(app.getHttpServer()).post('/event-details/bulk');
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('delete', () => {
    it.each([
      [200, undefined],
    ])('request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/event-details/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
