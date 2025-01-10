import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import * as request from 'supertest';
import { EventTypeOverviewController } from './event-type-overview.controller';
import { EventTypeService } from './event-type.service';

describe('EventTypeOverviewController e2e', () => {
  let app: INestApplication;
  const eventTypeService = {
    getOverviewByContext: jest.fn(() => of([])),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventTypeOverviewController],
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

  describe('get', () => {
    it.each([
      [200, undefined],
    ])('getOverview request should return status=%p', async (status: number, errors: string[]) => {
      const response = await request(app.getHttpServer()).get(`/event-type-overview`);
      expect(response.status).toEqual(status);
      expect(response.body.message).toEqual(errors);
    });
  });
});
