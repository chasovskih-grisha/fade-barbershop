// GWT e2e екранів 0–3 флоу запису (T-041, booking-flow-tests.md): приймальні
// сценарії поверх публічного API /booking/* проти Postgres. Then-частини
// звірені з критеріями MNG-ADM-01…12; правило вимкнених об'єктів —
// відсутність у відповіді, не disabled-стан.
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { BookingModule } from '../booking.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { getWithRetry } from '@fade/test-utils';
import {
  buildGwtIds,
  cleanupGwt,
  seedGwt,
  GWT_CLOSED_DATE,
  GWT_DATE,
} from './booking-flow-gwt.fixtures';

describe('Booking flow GWT (e2e, Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const ids = buildGwtIds();

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
  const get = (url: string) => request(app.getHttpServer()).get(url);
  const slots = (body: object) => request(app.getHttpServer()).post('/booking/slots').send(body);
  // prettier-ignore
  const index = (body: { start: string; end: string; barbers: string[] }[]) => new Map(body.map((s) => [s.start, s]));
  // 500 (насичення пулу при паралельному бігу) — транзитно: спільний
  // хелпер @fade/test-utils (GET ретраїть лише 500, очікує 200).
  const getOk = (url: string) => getWithRetry((u: string) => get(u), url);
  /** Базовий запит слотів; тести уточнюють поля. */
  const base = { locationId: ids.location, date: GWT_DATE, serviceId: ids.service };

  test('Екран 0: гість бачить лише активні локації (вимкнена — відсутня)', async () => {
    const res = await getOk('/booking/locations');
    const codes = res.body.map((l: { code: string }) => l.code).join();
    expect(codes).toContain('GWT-01');
    expect(codes).not.toContain('GWT-OLD'); // відсутня, не disabled
  });

  test('Екран 1: каталог локації — активні послуги з ціною локації, вимкнена відсутня', async () => {
    const res = await getOk(`/booking/services/${ids.location}`);
    const names = res.body.map((s: { name: string }) => s.name).join();
    expect(names).toContain('Стрижка GWT');
    expect(names).not.toContain('Догляд GWT'); // MNG-ADM-10: не disabled
    const haircut = res.body.find((s: { name: string }) => s.name.includes('Стрижка GWT'));
    expect(haircut).toMatchObject({ price: 600, duration: 50 }); // MNG-ADM-11/12
    const party = res.body.find((s: { name: string }) => s.name.includes('Батько + син'));
    expect(party).toMatchObject({ duration: 90, parallelDuration: 50 });
  });

  test('Екран 2: лише призначені локації барбери, «Будь-який» перший, чужий відсутній', async () => {
    const res = await getOk(`/booking/barbers/${ids.location}`);
    expect(res.body[0]).toMatchObject({ any: true });
    // prettier-ignore
    const listed = res.body.slice(1).map((b: { id: string }) => b.id).sort();
    expect(listed).toEqual([ids.barberA, ids.barberB].sort());
    expect(listed).not.toContain(ids.barberOther); // MNG-ADM-05/06
  });

  test('Екран 3: слот 11:00 вільний, зайняті 14:00–15:30 disabled, середа відсутня', async () => {
    const res = await slots(base).expect(201);
    const byStart = index(res.body);
    // 50-хв послуга округлюється до сітки: слот 11:00 займає 11:00–12:00.
    expect(byStart.get('11:00')).toMatchObject({ start: '11:00', end: '12:00' });
    expect(byStart.get('11:00')?.barbers.sort()).toEqual([ids.barberA, ids.barberB].sort());
    // Зайняті крісла 14:00–15:30 — у стрічці disabled (barbers: []), не сховані.
    expect(byStart.get('14:00')).toMatchObject({ start: '14:00', barbers: [] });
    expect(byStart.get('15:00')).toMatchObject({ start: '15:00', barbers: [] });
    // За графіком барберів (до 18:00) слоти disabled, лишаючись у стрічці
    // (стрічка — за годинами локації до 20:00): 17:30 + 60 хв > 18:00.
    expect(byStart.get('17:30')).toMatchObject({ barbers: [] });
  });

  test('Екран 3, середа — вихідний локації: стрічка порожня', async () => {
    const res = await slots({ ...base, date: GWT_CLOSED_DATE }).expect(201);
    expect(res.body).toEqual([]);
  });

  test('Екран 3, конкретний барбер: зайнятий інтервал дає disabled слоти', async () => {
    const res = await slots({ ...base, barberId: ids.barberA }).expect(201);
    const byStart = index(res.body);
    expect(byStart.get('11:00')?.barbers).toEqual([ids.barberA]);
    expect(byStart.get('14:00')).toMatchObject({ barbers: [] });
  });

  test('Екран 3, 404/400-гілки: неактивна локація, невалідна дата, невідома послуга, parallel без parallelDuration', async () => {
    await slots({ ...base, locationId: ids.locationOld }).expect(404);
    await slots({ ...base, date: 'не-дата' }).expect(400);
    await slots({ ...base, serviceId: 'nope' }).expect(404);
    await slots({ ...base, fulfillmentMode: 'parallel' }).expect(400);
  });
});
