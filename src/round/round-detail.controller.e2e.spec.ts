import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import * as request from 'supertest';
import { RANDOM_UUID } from '../test.utils';
import { RoundDetailController } from './round-detail.controller';
import { RoundDetailService } from './round-detail.service';

describe('RoundDetailController e2e', () => {
  let app: INestApplication;
  const roundService = {
    create: jest.fn(() => of({ round: {}, celebration: {} })),
    findByGameId: jest.fn(() => of([])),
    getDetails: jest.fn(() => of(null)),
    updateAttendees: jest.fn(() => of(null)),
    updateFinalists: jest.fn(() => of(null)),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RoundDetailController],
      providers: [
        RoundDetailService,
      ]
    })
      .overrideProvider(RoundDetailService)
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
        response = await request(app.getHttpServer()).post('/round-details').send(body);
      } else {
        response = await request(app.getHttpServer()).post('/round-details');
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('get', () => {
    it.each([
      [200, undefined],
    ])('getByGameId request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/round-details/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });

    it.each([
      [200, undefined],
    ])('getDetails request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/round-details/${RANDOM_UUID()}/details`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('update', () => {
    it.each([
      [null, 400, ['each value in playerIds must be a UUID', 'playerIds must be an array']],
      [{ playerIds: 'no-array' }, 400, ['each value in playerIds must be a UUID', 'playerIds must be an array']],
      [{ playerIds: [RANDOM_UUID(), 'invalid-uuid'] }, 400, ['each value in playerIds must be a UUID']],
      [{ playerIds: [RANDOM_UUID(), RANDOM_UUID()] }, 200, undefined],
    ])('updateAttendees request with with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/round-details/${RANDOM_UUID()}/attendees`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/round-details/${RANDOM_UUID()}/attendees`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });

    it.each([
      [null, 400, ['each value in playerIds must be a UUID', 'playerIds must be an array']],
      [{ playerIds: 'no-array' }, 400, ['each value in playerIds must be a UUID', 'playerIds must be an array']],
      [{ playerIds: [RANDOM_UUID(), 'invalid-uuid'] }, 400, ['each value in playerIds must be a UUID']],
      [{ playerIds: [RANDOM_UUID(), RANDOM_UUID()] }, 200, undefined],
    ])('updateFinalists request with with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/round-details/${RANDOM_UUID()}/finalists`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/round-details/${RANDOM_UUID()}/finalists`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('delete', () => {
    it.each([
      [200, undefined],
    ])('request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/round-details/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
