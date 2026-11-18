// E2E перенесення запису (T-4533): атомарний move через RescheduleAppointment — час змінено, appointmentId і статус незмінні, подія несе old/new час, 409 без часткового переносу, барберу 400, завершений 409.
import { HttpStatus } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import request from 'supertest';
import { postWithRetry } from '@fade/test-utils';
import { command } from './appointment-lifecycle.fixtures';
import { lifecycleSuite, type LifecycleSuite } from './appointment-lifecycle.suite';

const NEW_DATE = '2026-11-16'; // Інший понеділок — графіки барбера у фікстурах лише на день тижня 0.

describe('RescheduleAppointment (e2e, Postgres)', () => {
  let ctx: LifecycleSuite;
  let appointmentId = '';

  beforeAll(async () => {
    ctx = await lifecycleSuite({ admin: true, book: { start: '10:00', end: '10:30' } });
    appointmentId = ctx.bookingId;
  });

  afterAll(() => ctx.cleanup());

  const admin = { actorId: 'admin-1', actorRole: 'admin' };
  // prettier-ignore
  const move = (id: string, body: object) => request(ctx.app.getHttpServer()).post(`/admin/appointments/${id}/reschedule`).send(body);
  // 409 (P2034 Serializable) і 500 (насичення пулу) — транзитні: спільний
  // хелпер @fade/test-utils (очікує 200); move без очікування — для 400/404/409-кейсів.
  const moveOk = (id: string, body: object) =>
    postWithRetry((b: object) => move(id, b), body, { expectStatus: HttpStatus.OK });
  const rowOf = (id: string) => ctx.prisma.booking.findUnique({ where: { id } });

  test('admin переносить на іншу дату: час змінено, appointmentId і статус на місці', async () => {
    // prettier-ignore
    const res = await moveOk(appointmentId, { ...admin, date: NEW_DATE, start: '12:00', end: '12:30' });
    expect(res.body).toMatchObject({ status: 'ok' });
    const row = await rowOf(appointmentId);
    expect(row?.start.toISOString()).toBe(`${NEW_DATE}T12:00:00.000Z`);
    expect(row?.end.toISOString()).toBe(`${NEW_DATE}T12:30:00.000Z`);
    expect(row?.appointmentId).toBe(appointmentId);
    expect(row?.status).toBe('booked');
    const event = await ctx.prisma.outboxMessage.findFirst({
      where: { aggregateId: appointmentId, type: 'scheduling.appointment.rescheduled' },
      orderBy: { createdAt: 'desc' },
    });
    expect(event?.payload).toMatchObject({
      appointmentId,
      actorId: 'admin-1',
      actorRole: 'admin',
      oldStart: '2026-11-09T10:00:00.000Z',
      oldEnd: '2026-11-09T10:30:00.000Z',
      newStart: `${NEW_DATE}T12:00:00.000Z`,
    });
  });

  test('клієнт теж може переносити', async () => {
    // prettier-ignore
    const res = await moveOk(appointmentId, { actorId: 'client-1', actorRole: 'client', date: NEW_DATE, start: '13:00', end: '13:30' });
    expect(res.body).toMatchObject({ status: 'ok' });
    const row = await rowOf(appointmentId);
    expect(row?.start.toISOString()).toBe(`${NEW_DATE}T13:00:00.000Z`);
  });

  test('конфлікт із іншим записом барбера → 409, старий час НЕ змінено', async () => {
    // prettier-ignore
    const other = { id: uuidv7(), barberId: ctx.ids.barber1, locationId: ctx.ids.location, start: new Date(`${NEW_DATE}T09:00:00.000Z`), end: new Date(`${NEW_DATE}T09:30:00.000Z`), version: 0 };
    await ctx.prisma.booking.create({ data: other });
    const before = await rowOf(appointmentId);
    await move(appointmentId, { ...admin, date: NEW_DATE, start: '09:00', end: '09:30' }).expect(
      HttpStatus.CONFLICT
    );
    const after = await rowOf(appointmentId);
    expect(after?.start.toISOString()).toBe(before?.start.toISOString());
    expect(after?.end.toISOString()).toBe(before?.end.toISOString());
  });

  test('адмін-маршрут: барберу 400, без дати 400, неіснуючий 404', async () => {
    // prettier-ignore
    await move(appointmentId, { actorId: ctx.ids.barber1, actorRole: 'barber', date: NEW_DATE, start: '07:00', end: '07:30' }).expect(HttpStatus.BAD_REQUEST);
    // prettier-ignore
    await move(appointmentId, { ...admin, start: '07:00', end: '07:30' }).expect(HttpStatus.BAD_REQUEST);
    // prettier-ignore
    await move('00000000-0000-4000-8000-000000000000', { ...admin, date: NEW_DATE, start: '07:00', end: '07:30' }).expect(HttpStatus.NOT_FOUND);
  });

  test('завершений запис не переноситься → 409, час і статус не змінюються', async () => {
    await command({ app: ctx.app, id: appointmentId, action: 'confirm', dto: admin });
    await command({ app: ctx.app, id: appointmentId, action: 'start', dto: admin });
    await command({ app: ctx.app, id: appointmentId, action: 'complete', dto: admin });
    const before = await rowOf(appointmentId);
    // prettier-ignore
    await move(appointmentId, { ...admin, date: NEW_DATE, start: '16:00', end: '16:30' }).expect(HttpStatus.CONFLICT);
    const after = await rowOf(appointmentId);
    expect(after?.status).toBe(before?.status);
    expect(after?.start.toISOString()).toBe(before?.start.toISOString());
  });
});
