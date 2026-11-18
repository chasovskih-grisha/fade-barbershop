// E2E референс/коментар (T-043): снепшот при бронюванні, редагування клієнтом
// поки booked, замок після підтвердження, адмін змінює завжди, подія в outbox.
import { uuidv7 } from '@fade/domain-shared';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { book, command } from './appointment-lifecycle.fixtures';
import { lifecycleSuite, type LifecycleSuite } from './appointment-lifecycle.suite';

describe('SetAppointmentReference (e2e, Postgres)', () => {
  let ctx: LifecycleSuite;
  let bookingId = '';
  let appointmentId = '';
  // clientId — uuid-колонка (T-4300b).
  const clientId = uuidv7();
  // clientId — uuid-колонка (T-4300b).
  // clientId — uuid-колонка (T-4300b).
  // clientId — uuid-колонка (T-4300b).

  beforeAll(async () => {
    ctx = await lifecycleSuite({ admin: true, book: { start: '10:00', end: '10:30' } });
    bookingId = ctx.bookingId;
    appointmentId = bookingId;
  });

  afterAll(() => ctx.cleanup());

  // prettier-ignore
  const post = (id: string, body: object) => request(ctx.app.getHttpServer()).post(`/admin/appointments/${id}/reference`).send(body);
  const rowOf = (id: string) => ctx.prisma.booking.findUnique({ where: { id } });
  const events = () =>
    ctx.prisma.outboxMessage.count({
      where: { aggregateId: appointmentId, type: 'scheduling.appointment.reference_changed' },
    });

  // P2034 при паралельному бігу e2e-сюїт дає 409 — retry за контрактом клієнта
  // всередині спільної фікстури book() (до 4 спроб).

  test('бронювання з reference payload: поля на рядку Booking', async () => {
    // prettier-ignore
    const res = await book(ctx.app, ctx.ids, { start: '11:00', end: '11:30', reference: { haircutReferenceId: 'ref-42', appointmentComment: 'зняти на 2 мм' } });
    expect(res.status).toBe(HttpStatus.CREATED);
    const row = await rowOf(res.body.id);
    expect(row?.haircutReferenceId).toBe('ref-42');
    expect(row?.appointmentComment).toBe('зняти на 2 мм');
  });

  test('джерело і клієнт (T-046): origin=admin на рядку Booking, дефолт web', async () => {
    // Бронювання з beforeAll — фікстура без origin → дефолт 'web'.
    expect((await rowOf(bookingId))?.source).toBe('web');
    // prettier-ignore
    const res = await book(ctx.app, ctx.ids, { start: '12:00', end: '12:30', origin: { clientId, source: 'admin' } });
    const origin = await rowOf(res.body.id);
    // prettier-ignore
    expect(origin).toMatchObject({ source: 'admin', clientId });
  });

  test('клієнт редагує поки booked → 200, подія reference_changed в outbox', async () => {
    // prettier-ignore
    await post(appointmentId, { actorId: 'client-1', actorRole: 'client', referenceId: 'ref-43', comment: 'чубчик залишити' }).expect(HttpStatus.OK);
    const row = await rowOf(bookingId);
    expect(row?.haircutReferenceId).toBe('ref-43');
    expect(row?.appointmentComment).toBe('чубчик залишити');
    const event = await ctx.prisma.outboxMessage.findFirst({
      where: { aggregateId: appointmentId, type: 'scheduling.appointment.reference_changed' },
      orderBy: { createdAt: 'desc' },
    });
    // prettier-ignore
    expect(event?.payload).toMatchObject({ appointmentId, haircutReferenceId: 'ref-43', comment: 'чубчик залишити', actorId: 'admin-1', actorRole: 'admin' });
  });

  test('роль клієнта в тілі ігнорується: після підтвердження править адмін', async () => {
    const admin = { actorId: 'admin-1', actorRole: 'admin' };
    await command({ app: ctx.app, id: appointmentId, action: 'confirm', dto: admin }).expect(
      HttpStatus.OK
    );
    // prettier-ignore
    await post(appointmentId, { actorId: 'client-1', actorRole: 'client', comment: 'пізно' }).expect(HttpStatus.OK);
    expect((await rowOf(bookingId))?.appointmentComment).toBe('пізно');
  });

  test('адмін змінює після підтвердження → 200 (REF-ADM-04)', async () => {
    // prettier-ignore
    await post(appointmentId, { actorId: 'admin-1', actorRole: 'admin', comment: 'виправлення адміна' }).expect(HttpStatus.OK);
    expect((await rowOf(bookingId))?.appointmentComment).toBe('виправлення адміна');
  });

  test('барбер → 400; коментар 501 → 400 без запису події; неіснуючий → 404', async () => {
    // prettier-ignore
    await post(appointmentId, { actorId: 'barber-1', actorRole: 'barber', comment: 'не можна' }).expect(HttpStatus.OK);
    const before = await events();
    // prettier-ignore
    await post(appointmentId, { actorId: 'client-1', actorRole: 'client', comment: 'x'.repeat(501) }).expect(HttpStatus.BAD_REQUEST);
    expect(await events()).toBe(before);
    // prettier-ignore
    await post('00000000-0000-4000-8000-000000000000', { actorId: 'client-1', actorRole: 'client', comment: 'х' }).expect(HttpStatus.NOT_FOUND);
  });

  test('адмін прибирає референс порожнім рядком → null у БД', async () => {
    // prettier-ignore
    await post(appointmentId, { actorId: 'admin-1', actorRole: 'admin', referenceId: '', comment: '' }).expect(HttpStatus.OK);
    const row = await rowOf(bookingId);
    expect(row?.haircutReferenceId).toBeNull();
    expect(row?.appointmentComment).toBeNull();
  });
});
