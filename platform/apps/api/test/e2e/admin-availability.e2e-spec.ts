import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { SchedulingModule } from '../scheduling/scheduling.module';

describe('Admin Availability E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SchedulingModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('GET /admin/barbers/:barberId/availability/:locationId returns schedule', async () => {
    const result = await request(app.getHttpServer())
      .get('/admin/barbers/barber1/availability/loc1')
      .expect(200);
    expect(result.body).toBeDefined();
  });

  test('PATCH /admin/barbers/:barberId/availability sets availability', async () => {
    const result = await request(app.getHttpServer())
      .patch('/admin/barbers/barber1/availability')
      .send({ locationId: 'loc1', windows: [{ dayOfWeek: 1, start: '09:00', end: '12:00' }] })
      .expect(202);
    expect(result.body).toBeDefined();
  });
});
