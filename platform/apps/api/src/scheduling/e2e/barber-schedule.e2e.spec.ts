// T-230 e2e: барбер бачить і редагує власний графік у межах годин локації;
// конфлікт із заброньованим візитом не зберігає графік і повертає 409.
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Booking } from '../domain/booking';
import { buildAdminAvailabilityApp } from './admin-availability.e2e.setup';

describe('Barber self-service schedule API (e2e)', () => {
  let app: INestApplication;
  let bookings: Booking[];
  let changeLog: { append: jest.Mock };
  const cookie = 'fadoidx=barber-token';
  const route = '/barber/schedule/location-1';

  beforeAll(async () => {
    bookings = [];
    ({ app, changeLog } = await buildAdminAvailabilityApp(bookings));
  });

  afterAll(async () => app.close());

  it('requires a barber session and exposes the permission flag', async () => {
    await request(app.getHttpServer()).get(route).expect(401);
    await request(app.getHttpServer()).get(route).set('Cookie', cookie).expect(200).expect({
      barberId: 'barber-1',
      locationId: 'location-1',
      windows: [],
      version: 0,
      canEdit: true,
      history: [],
    });
  });

  it('saves a delegated window and writes the change log', async () => {
    await request(app.getHttpServer())
      .put(route)
      .set('Cookie', cookie)
      .send({ windows: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }] })
      .expect(200)
      .expect({ version: 0 });

    expect(changeLog.append).toHaveBeenCalledWith(
      expect.objectContaining({
        barberId: 'barber-1',
        locationId: 'location-1',
        source: 'barber',
        changedBy: 'barber-1',
      })
    );
  });

  it('blocks a save that conflicts with an existing visit', async () => {
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

    const response = await request(app.getHttpServer())
      .put(route)
      .set('Cookie', cookie)
      .send({ windows: [{ dayOfWeek: 0, start: '09:00', end: '10:00' }] })
      .expect(409);

    expect(response.body.message).toContain('conflict');
    expect(response.body.conflicts).toEqual([
      { bookingId: 'booking-1', clientId: null, serviceId: null, start: '10:00', end: '10:30' },
    ]);
    expect(changeLog.append).toHaveBeenCalledTimes(1);
  });

  it('serves the network change log to admins', async () => {
    await request(app.getHttpServer())
      .get('/admin/schedule/change-log')
      .set('Cookie', 'fadoidx=admin-token')
      .expect(200)
      .expect({ items: [], total: 0 });
  });
});
