// E2E публічного ендпоінта «найближчі локації»: усі фолбеки (далеко /
// невідоме місто / без координат / сміття в query) не ховають локації.

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buildApp, MemGeocoder } from './nearest-locations.e2e.setup';

describe('/locations/nearest fallbacks (e2e)', () => {
  let app: INestApplication;
  let geocoder: MemGeocoder;

  beforeAll(async () => {
    geocoder = new MemGeocoder();
    ({ app, geocoder } = await buildApp(geocoder));
  });

  afterAll(async () => app.close());

  test('далеко поза мережею, місто невідоме: повний список у початковому порядку', async () => {
    const res = await request(app.getHttpServer())
      .get('/locations/nearest?lat=10.0&lng=10.0')
      .expect(200);
    expect(res.body.city).toBeNull();
    expect(res.body.sortedByDistance).toBe(false);
    expect(res.body.locations.map((l: { code: string }) => l.code)).toEqual([
      'KYY-01',
      'KYY-02',
      'LVI-01',
    ]);
  });

  test('сміття в координатах деградує до звичайного списку (не 400 — контракт DTO)', async () => {
    const callsBefore = geocoder.calls.length;
    const res = await request(app.getHttpServer())
      .get('/locations/nearest?lat=999&lng=30.5')
      .expect(200);
    expect(res.body.city).toBeNull();
    expect(res.body.sortedByDistance).toBe(false);
    expect(res.body.locations).toHaveLength(3);
    // Геокодер не викликається: невалідні координати відфільтровані до нього.
    expect(geocoder.calls).toHaveLength(callsBefore);
  });

  test('відповідь стабільна для однакових координат', async () => {
    const a = await request(app.getHttpServer())
      .get('/locations/nearest?lat=50.4501&lng=30.5234')
      .expect(200);
    const b = await request(app.getHttpServer())
      .get('/locations/nearest?lat=50.4501&lng=30.5234')
      .expect(200);
    expect(a.body.locations.map((l: { code: string }) => l.code)).toEqual(
      b.body.locations.map((l: { code: string }) => l.code)
    );
  });
});
