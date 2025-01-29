import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import * as request from 'supertest';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { RANDOM_STRING, RANDOM_UUID } from '../test.utils';
import { EventTypeContext } from './enum/event-type-context.enum';
import { EventTypeTrigger } from './enum/event-type-trigger.enum';
import { EventTypeController } from './event-type.controller';
import { EventTypeService } from './event-type.service';

describe('EventTypeController e2e', () => {
  let app: INestApplication;
  const eventTypeService = {
    create: jest.fn(() => of(null)),
    findOne: jest.fn(() => of(null)),
    findAll: jest.fn(() => of([])),
    update: jest.fn(() => of(null)),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventTypeController],
      providers: [
        EventTypeService
      ]
    })
      .overrideProvider(EventTypeService)
      .useValue(eventTypeService)
      .compile();

    app = moduleRef.createNestApplication().useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create', () => {
    it.each([
      [null, 400, ['description must be shorter than or equal to 64 characters', 'description must be a string', 'context must be one of the following values: GAME, ROUND']],
      [{ description: RANDOM_STRING(65) }, 400, ['description must be shorter than or equal to 64 characters', 'context must be one of the following values: GAME, ROUND']],
      [{ description: RANDOM_STRING(64), context: 'invalid' }, 400, ['context must be one of the following values: GAME, ROUND']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME }, 201, undefined],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(33) }, 400, ['multiplicatorUnit must be shorter than or equal to 32 characters']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: 'invalid' }, 400, ['trigger must be one of the following values: VERLOREN, SCHOCK_AUS, SCHOCK_AUS_STRAFE']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN }, 201, undefined],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: -1.234 }}, 400, ['penalty.penaltyValue must not be less than 0', 'penalty.penaltyValue must be a number conforming to the specified constraints']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyUnit: 'invalid' }}, 400, ['penalty.penaltyUnit must be one of the following values: EURO, BEER_CRATE']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyUnit: PenaltyUnit.EURO }}, 400, ['when specified, both penaltyValue and penaltyUnit must be present']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: -1.234, penaltyUnit: PenaltyUnit.EURO }}, 400, ['penalty.penaltyValue must not be less than 0', 'penalty.penaltyValue must be a number conforming to the specified constraints']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: 1.23, penaltyUnit: 'invalid' }}, 400, ['penalty.penaltyUnit must be one of the following values: EURO, BEER_CRATE']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: 1.23, penaltyUnit: PenaltyUnit.EURO }}, 201, undefined],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: null}, 201, undefined],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: null, penaltyUnit: null }}, 201, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).post('/event-type').send(body);
      } else {
        response = await request(app.getHttpServer()).post('/event-type');
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('get', () => {
    it.each([
      [200, undefined],
    ])('findAll request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/event-type`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('update', () => {
    it.each([
      [null, 200, undefined],
      [{ description: RANDOM_STRING(65) }, 400, ['description must be shorter than or equal to 64 characters']],
      [{ description: RANDOM_STRING(64), context: 'invalid' }, 400, ['context must be one of the following values: GAME, ROUND']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME }, 200, undefined],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(33) }, 400, ['multiplicatorUnit must be shorter than or equal to 32 characters']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: 'invalid' }, 400, ['trigger must be one of the following values: VERLOREN, SCHOCK_AUS, SCHOCK_AUS_STRAFE']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN }, 200, undefined],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: -1.234 }}, 400, ['penalty.penaltyValue must not be less than 0', 'penalty.penaltyValue must be a number conforming to the specified constraints']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyUnit: 'invalid' }}, 400, ['penalty.penaltyUnit must be one of the following values: EURO, BEER_CRATE']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyUnit: PenaltyUnit.EURO }}, 400, ['when specified, both penaltyValue and penaltyUnit must be present']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: -1.234, penaltyUnit: PenaltyUnit.EURO }}, 400, ['penalty.penaltyValue must not be less than 0', 'penalty.penaltyValue must be a number conforming to the specified constraints']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: 1.23, penaltyUnit: 'invalid' }}, 400, ['penalty.penaltyUnit must be one of the following values: EURO, BEER_CRATE']],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: 1.23, penaltyUnit: PenaltyUnit.EURO }}, 200, undefined],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: null}, 200, undefined],
      [{ description: RANDOM_STRING(64), context: EventTypeContext.GAME, hasComment: true, multiplicatorUnit: RANDOM_STRING(32), trigger: EventTypeTrigger.VERLOREN, penalty: { penaltyValue: null, penaltyUnit: null }}, 200, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/event-type/${RANDOM_UUID()}`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/event-type/${RANDOM_UUID()}`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('delete', () => {
    it.each([
      [200, undefined],
    ])('request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/event-type/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
