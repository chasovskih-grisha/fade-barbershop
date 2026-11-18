import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Booking } from '../domain/booking';
import { buildAdminAvailabilityApp } from './admin-availability.e2e.setup';

describe('Admin availability API (e2e)', () => {
  let app: INestApplication;
  let bookings: Booking[];
  const cookie = 'fadoidx=admin-token';

  beforeAll(async () => {
    bookings = [];
    ({ app } = await buildAdminAvailabilityApp(bookings));
  });

  afterAll(async () => app.close());

  it('protects schedule routes and validates hours and existing bookings', async () => {
    const route = '/admin/barbers/barber-1/availability';
    const url = `${route}/location-1`;
    await request(app.getHttpServer()).get(url).expect(401);
    await request(app.getHttpServer())
      .get(url)
      .set('Cookie', cookie)
      .expect(200)
      .expect({ barberId: 'barber-1', locationId: 'location-1', windows: [], version: 0 });
    await request(app.getHttpServer())
      .patch(route)
      .set('Cookie', cookie)
      .send({ locationId: 'location-1', windows: [{ dayOfWeek: 0, start: '08:00', end: '12:00' }] })
      .expect(400);

    const valid = {
      locationId: 'location-1',
      windows: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }],
    };
    await request(app.getHttpServer())
      .patch(route)
      .set('Cookie', cookie)
      .send(valid)
      .expect(202)
      .expect({ version: 0 });
    await request(app.getHttpServer()).get(url).set('Cookie', cookie).expect(200).expect({
      barberId: 'barber-1',
      locationId: 'location-1',
      windows: valid.windows,
      version: 0,
    });

    bookings.push(
      Booking.reconstitute({
        id: 'booking-1',
        barberId: 'barber-1',
        locationId: 'location-1',
        start: new Date('2026-09-28T10:00:00Z'),
        end: new Date('2026-09-28T10:30:00Z'),
        version: 0,
      })
    );
    await request(app.getHttpServer())
      .patch(route)
      .set('Cookie', cookie)
      .send({ ...valid, windows: [{ dayOfWeek: 0, start: '09:00', end: '10:00' }] })
      .expect(409);
  });
});
