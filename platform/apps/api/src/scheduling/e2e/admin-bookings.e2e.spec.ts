import { uuidv7 } from '@fade/domain-shared';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { SchedulingModule } from '../scheduling.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  assignBarber,
  cleanupTestLocation,
  postWithRetry,
  seedBarberUser,
  seedRawBooking,
  seedTestLocation,
} from '@fade/test-utils';

const DATE = '2026-10-05'; // Monday in the admin's Monday-first week model.

describe('AdminBookingsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  // prettier-ignore
  const ids = { location: uuidv7(), barber1: uuidv7(), barber2: uuidv7() };
  const post = (body: object) => request(app.getHttpServer()).post('/admin/bookings').send(body);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SchedulingModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    // prettier-ignore
    await seedTestLocation(prisma, { id: ids.location, codePrefix: 'RACE', name: 'Booking race test', chairs: 2 });
    await seedBarberUser(prisma, { id: ids.barber1, name: 'Race Barber 1' });
    await seedBarberUser(prisma, { id: ids.barber2, name: 'Race Barber 2' });
    // prettier-ignore
    await assignBarber(prisma, { locationId: ids.location, barberId: ids.barber1, dayOfWeek: 0, window: { start: '08:00', end: '18:00' } });
    // prettier-ignore
    await assignBarber(prisma, { locationId: ids.location, barberId: ids.barber2, dayOfWeek: 0, window: { start: '08:00', end: '18:00' } });
  });

  afterAll(async () => {
    await cleanupTestLocation(prisma, { id: ids.location }, [ids.barber1, ids.barber2]);
    await app.close();
  });

  test('creates a dated booking when chairs and barber are free', async () => {
    // prettier-ignore
    const payload = { barberId: ids.barber1, locationId: ids.location, date: DATE, start: '11:15', end: '11:45', serviceDuration: 30 };
    // 409 (P2034 Serializable) і 500 (насичення пулу) — транзитні: повтор
    // за контрактом клієнта в спільному хелпері @fade/test-utils.
    const response = await postWithRetry((b: object) => post(b), payload);
    const saved = await prisma.booking.findUnique({ where: { id: response.body.id } });
    expect(saved?.start.toISOString()).toBe(`${DATE}T11:15:00.000Z`);
  });

  test('returns 400 when the requested time is outside opening hours', async () => {
    // prettier-ignore
    const body400 = { barberId: ids.barber1, locationId: ids.location, date: DATE, start: '07:00', end: '07:30', serviceDuration: 30 };
    await post(body400).expect(HttpStatus.BAD_REQUEST);
  });

  test('allows only one of two concurrent requests when one chair is already occupied', async () => {
    // prettier-ignore
    await seedRawBooking(prisma, { locationId: ids.location, barberId: uuidv7(), start: new Date(`${DATE}T09:50:00.000Z`), end: new Date(`${DATE}T10:05:00.000Z`) });
    // prettier-ignore
    const payloadFor = (barberId: string) => ({ barberId, locationId: ids.location, date: DATE, start: '10:00', end: '10:30', serviceDuration: 30 });
    // Тут 409 має ДВІ причини: транзитна P2034 (повторюється) і фінальний
    // конфлікт крісла (результат гонки) — цикл міряє фінальний статус, а не
    // добивається 201, тому postWithRetry тут не підходить за контрактом.
    // prettier-ignore
    const attempt = async (barberId: string): Promise<number> => {
      let res = await post(payloadFor(barberId));
      for (let i = 0; i < 3 && (res.status === undefined || res.status === HttpStatus.CONFLICT); i += 1) res = await post(payloadFor(barberId));
      return res.status;
    };
    const statuses = (await Promise.all([attempt(ids.barber1), attempt(ids.barber2)])).sort();
    expect(statuses[0]).toBe(HttpStatus.CREATED);
    expect(statuses[1]).toBe(HttpStatus.CONFLICT);
  });
});
