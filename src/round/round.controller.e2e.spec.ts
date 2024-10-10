import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import * as request from 'supertest';
import { RANDOM_UUID } from '../test.utils';
import { RoundController } from './round.controller';
import { RoundService } from './round.service';

describe('RoundController e2e', () => {
  let app: INestApplication;
  const roundService = {
    create: jest.fn(() => of({})),
    findOne: jest.fn(() => of(null)),
    findAll: jest.fn(() => of([])),
    update: jest.fn(() => of(null)),
    remove: jest.fn(),
    updateAttendees: jest.fn(() => of(null)),
    addFinalist: jest.fn(() => of(null)),
    removeFinalist: jest.fn(() => of(null)),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RoundController],
      providers: [
        RoundService,
      ]
    })
      .overrideProvider(RoundService)
      .useValue(roundService)
      .compile();

    app = moduleRef.createNestApplication().useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create', () => {
    it.each([
      [null, 400, ['gameId must be a UUID']],
      [{}, 400, ['gameId must be a UUID']],
      [{ gameId: 'invalid-uuid' }, 400, ['gameId must be a UUID']],
      [{ gameId: RANDOM_UUID() }, 201, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).post('/round').send(body);
      } else {
        response = await request(app.getHttpServer()).post('/round');
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('get', () => {
    it.each([
      [200, undefined],
    ])('findOne request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/round/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });

    it.each([
      [200, undefined],
    ])('findAll request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/round`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('update', () => {
    it.each([
      [null, 200, undefined],
      [{}, 200, undefined],
      [{ gameId: 'invalid-uuid' }, 400, ['gameId must be a UUID']],
      [{ gameId: RANDOM_UUID() }, 200, undefined],
    ])('update request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/round/${RANDOM_UUID()}`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/round/${RANDOM_UUID()}`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('delete', () => {
    it.each([
      [200, undefined],
    ])('request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/round/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('addAttendees', () => {
    it.each([
      [null, 400, ['each value in playerIds must be a UUID', 'playerIds must be an array']],
      [{ playerIds: 'no-array' }, 400, ['each value in playerIds must be a UUID', 'playerIds must be an array']],
      [{ playerIds: [RANDOM_UUID(), 'invalid-uuid'] }, 400, ['each value in playerIds must be a UUID']],
      [{ playerIds: [RANDOM_UUID(), RANDOM_UUID()] }, 200, undefined],
    ])('request with with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/round/${RANDOM_UUID()}/attendees`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/round/${RANDOM_UUID()}/attendees`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('addFinalist', () => {
    it.each([
      [RANDOM_UUID(), RANDOM_UUID(), 200, undefined],
    ])('request with roundId %p and playerId %p should return status=%p and errors=%p', async (roundId: string, playerId: string, status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).patch(`/round/${roundId}/finalists/${playerId}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('removeFinalist', () => {
    it.each([
      [RANDOM_UUID(), RANDOM_UUID(), 200, undefined],
    ])('request with roundId %p and playerId %p should return status=%p and errors=%p', async (roundId: string, playerId: string, status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/round/${roundId}/finalists/${playerId}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
