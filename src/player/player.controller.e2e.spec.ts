import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RANDOM_STRING, RANDOM_UUID } from '../test.utils';
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
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        PlayerService,
        { provide: WINSTON_MODULE_PROVIDER, useValue: { warn: jest.fn() } }
      ]
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

  describe('create', () => {
    it.each([
      [null, 400, ['name must be shorter than or equal to 32 characters', 'name must be a string']],
      [{ name: RANDOM_STRING(32) }, 201, undefined],
      [{ name: RANDOM_STRING(33) }, 400, ['name must be shorter than or equal to 32 characters']],
      [{ name: RANDOM_STRING(32), registered: new Date().toISOString(), active: false }, 201, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
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

  describe('get', () => {
    it.each([
      [200, undefined],
    ])('findOne request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/player/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });

    it.each([
      [200, undefined],
    ])('findAll request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/player`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('update', () => {
    it.each([
      [null, 200, undefined],
      [{ name: RANDOM_STRING(32) }, 200, undefined],
      [{ name: RANDOM_STRING(33) }, 400, ['name must be shorter than or equal to 32 characters']],
      [{ name: RANDOM_STRING(32), registered: new Date().toISOString(), active: false }, 200, undefined],
    ])('request with body %p should return status=%p and errors=%p', async (body: object, status: number, errors: string[]) => {
      let response;
      if (body) {
        response = await request(app.getHttpServer()).patch(`/player/${RANDOM_UUID()}`).send(body);
      } else {
        response = await request(app.getHttpServer()).patch(`/player/${RANDOM_UUID()}`);
      }
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });

  describe('delete', () => {
    it.each([
      [200, undefined],
    ])('request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).delete(`/player/${RANDOM_UUID()}`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
