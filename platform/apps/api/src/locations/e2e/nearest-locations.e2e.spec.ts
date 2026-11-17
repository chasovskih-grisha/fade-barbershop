// E2E публічного ендпоінта «найближчі локації» (contract web-screens §1):
// радіус-сортування та фільтр за містом (зворотне геокодування).

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buildApp, MemGeocoder } from './nearest-locations.e2e.setup';

describe('/locations/nearest (e2e)', () => {
  let app: INestApplication;
  let geocoder: MemGeocoder;

  beforeAll(async () => {
    geocoder = new MemGeocoder();
    ({ app, geocoder } = await buildApp(geocoder));
  });

  afterAll(async () => app.close());

  test('без координат повертає всі активні локації без сортування', async () => {
    const res = await request(app.getHttpServer()).get('/locations/nearest').expect(200);
    expect(res.body.city).toBeNull();
    expect(res.body.sortedByDistance).toBe(false);
    expect(res.body.locations.map((l: { code: string }) => l.code)).toEqual([
      'KYY-01',
      'KYY-02',
      'LVI-01',
    ]);
    expect(res.body.locations[0].distanceKm).toBeNull();
  });

  test('клієнт у Києві: місто розпізнано, список відсортовано за відстанню, Львів відфільтровано', async () => {
    const res = await request(app.getHttpServer())
      .get('/locations/nearest?lat=50.4501&lng=30.5234')
      .expect(200);
    expect(res.body.city).toBe('Київ');
    expect(res.body.sortedByDistance).toBe(true);
    expect(res.body.locations.map((l: { code: string }) => l.code)).toEqual(['KYY-01', 'KYY-02']);
    const [first, second] = res.body.locations;
    expect(first.distanceKm).toBeGreaterThan(0);
    expect(first.distanceKm).toBeLessThan(second.distanceKm);
    expect(geocoder.calls).toHaveLength(1);
  });

  test('клієнт у Львові: бачить тільки Львів', async () => {
    const res = await request(app.getHttpServer())
      .get('/locations/nearest?lat=49.8397&lng=24.0297')
      .expect(200);
    expect(res.body.city).toBe('Львів');
    expect(res.body.sortedByDistance).toBe(true);
    expect(res.body.locations.map((l: { code: string }) => l.code)).toEqual(['LVI-01']);
  });
});
