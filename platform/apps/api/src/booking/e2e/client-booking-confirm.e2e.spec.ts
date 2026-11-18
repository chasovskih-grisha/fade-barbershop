// E2E екран 5 флоу запису (T-041): клієнтське підтвердження POST
// /booking/bookings — перший клієнтський споживач життєвого циклу Appointment.
// Той самий use case BookAppointment, що й POST /admin/bookings: валідації
// слота, снепшот ціни локації, агрегат Appointment + подія booked в outbox.
// Канал аналітики примусово 'web' (ANL-004) — не з DTO.
import { uuidv7 } from '@fade/domain-shared';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { BookingModule } from '../booking.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { postWithRetry } from '@fade/test-utils';
import { buildGwtIds, cleanupGwt, seedGwt, GWT_DATE, type GwtIds } from './booking-flow-gwt.fixtures';

describe('Client booking confirm (e2e, Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const ids: GwtIds = buildGwtIds();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [BookingModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await seedGwt(prisma, ids);
  });

  afterAll(async () => {
    await cleanupGwt(prisma, ids);
    await app.close();
  });

  // prettier-ignore
  const confirm = (body: object) => request(app.getHttpServer()).post('/booking/bookings').send(body);
  // 409 (P2034 Serializable) і 500 (насичення пулу) — повтор за контрактом
  // клієнта: спільний хелпер @fade/test-utils (очікує 201).
  const confirmOk = (body: object) => postWithRetry((b: object) => confirm(b), body);
  // clientId — uuid-колонка (T-4300b): валідний id замість читабельного.
  const clientId = uuidv7();
  // clientId — uuid-колонка (T-4300b): валідний id замість читабельного.
  // clientId — uuid-колонка (T-4300b): валідний id замість читабельного.
  // clientId — uuid-колонка (T-4300b): валідний id замість читабельного.
  // Слот 11:00–12:00 (50 хв округлюється до сітки) — вільний обом барберам.
  // prettier-ignore
  const base = { locationId: ids.location, serviceId: ids.service, date: GWT_DATE, start: '11:00', end: '12:00' };

  test('клієнт підтверджує: Booking + Appointment + подія booked, ціна локації', async () => {
    // prettier-ignore
    const res = await confirmOk({ ...base, clientId, reference: { appointmentComment: 'зняти на 2 мм' } });
    const row = await prisma.booking.findUnique({ where: { id: res.body.id } });
    // Снепшоти: ціна саме CLT-локації (MNG-ADM-11/12), коментар (T-043), канал web (ANL-004).
    // prettier-ignore
    expect(row).toMatchObject({ source: 'web', clientId, serviceId: ids.service, agreedPrice: 600, status: 'booked', appointmentComment: 'зняти на 2 мм' });
    expect(row?.appointmentId).toBe(res.body.id); // агрегат Appointment створено (T-042a)
    const event = await prisma.outboxMessage.findFirst({
      where: { aggregateId: res.body.id, type: 'scheduling.appointment.booked' },
    });
    expect(event).toBeTruthy();
  });

  test('канал аналітики серверний: source з DTO (навіть admin) проігноровано', async () => {
    const res = await confirmOk({ ...base, source: 'admin' });
    const row = await prisma.booking.findUnique({ where: { id: res.body.id } });
    expect(row?.source).toBe('web');
  });

  test('валідація і конфлікти: 409 зайнятий слот, 400 вихідний, 404 локація/послуга', async () => {
    // Обидва крісла зайняті 14:00–15:30 → конфлікт, без часткового запису.
    // prettier-ignore
    await confirm({ ...base, barberId: ids.barberA, start: '14:00', end: '15:00' }).expect(HttpStatus.CONFLICT);
    // prettier-ignore
    await confirm({ ...base, date: '2026-11-04' }).expect(HttpStatus.BAD_REQUEST); // середа — вихідний локації
    // prettier-ignore
    await confirm({ ...base, locationId: '00000000-0000-4000-8000-000000000000' }).expect(HttpStatus.NOT_FOUND);
    // prettier-ignore
    await confirm({ ...base, serviceId: '00000000-0000-4000-8000-000000000000' }).expect(HttpStatus.NOT_FOUND);
  });
});
