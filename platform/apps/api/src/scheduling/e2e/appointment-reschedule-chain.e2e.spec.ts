// E2E ланцюг перенесення (T-4533): клієнтський маршрут → use case → агрегат →
// подія rescheduled в outbox (ISO старий/новий час) → споживач-еталон
// застосовує подію ідемпотентно. Фікстури — reschedule-chain.fixture.ts.
import { HttpStatus } from '@nestjs/common';
import { lifecycleSuite, type LifecycleSuite } from './appointment-lifecycle.suite';
import { NEW_DATE, deliverActivity, dropWebClient, expectClientRouteErrors, moveBooking, newClientId, newWebToken, rescheduledEvents, rowOf, seedWebClient } from './reschedule-chain.fixture';

const clientId = newClientId();

describe('Reschedule chain: клієнт → подія → споживач (e2e, Postgres)', () => {
  let ctx: LifecycleSuite;
  let bookingId = '';
  let token = '';
  let move: ReturnType<typeof moveBooking>;

  beforeAll(async () => {
    ctx = await lifecycleSuite({ cookies: true, book: { start: '17:00', end: '17:30' } });
    bookingId = ctx.bookingId;
    await ctx.prisma.booking.update({ where: { id: bookingId }, data: { clientId } });
    token = newWebToken();
    await seedWebClient(ctx.prisma, clientId, token);
    move = moveBooking(ctx, token);
  });

  afterAll(async () => {
    await dropWebClient(ctx.prisma, clientId);
    await ctx.cleanup();
  });

  test('клієнт переносить свій запис; identity збережено, статус booked', async () => {
    const res = await move(bookingId, {
      actorId: 'client-7',
      date: NEW_DATE,
      start: '10:00',
      end: '10:30',
    });

    expect(res.status).toBe(HttpStatus.OK);
    const updated = await rowOf(ctx, bookingId);
    expect(updated?.start.toISOString()).toBe(`${NEW_DATE}T10:00:00.000Z`);
    expect(updated?.appointmentId).toBe(bookingId);
    expect(updated?.status).toBe('booked');
  });

  test('роль із DTO проігнорована — контролер примусово client', async () => {
    const res = await move(bookingId, {
      actorId: 'barber-1',
      actorRole: 'barber',
      date: NEW_DATE,
      start: '11:00',
      end: '11:30',
    });

    expect(res.status).toBe(HttpStatus.OK);
    expect((await rowOf(ctx, bookingId))?.start.toISOString()).toBe(`${NEW_DATE}T11:00:00.000Z`);
  });

  test('подія rescheduled несе ISO старий/новий час і актора-клієнта', async () => {
    const [event] = await rescheduledEvents(ctx, bookingId);

    expect(event?.payload).toMatchObject({
      appointmentId: bookingId,
      actorId: clientId,
      actorRole: 'client',
      oldStart: '2026-11-09T17:00:00.000Z',
      oldEnd: '2026-11-09T17:30:00.000Z',
      newStart: `${NEW_DATE}T10:00:00.000Z`,
    });
  });

  test('споживач-еталон: apply + повторна доставка duplicate (журнал UNIQUE)', async () => {
    const [first] = await rescheduledEvents(ctx, bookingId);
    if (!first) throw new Error('rescheduled event not found in outbox');
    const deliver = deliverActivity(ctx, first);

    await expect(deliver()).resolves.toMatchObject({ handled: true, reason: 'applied' });
    await expect(deliver()).resolves.toMatchObject({ handled: false, reason: 'duplicate' });
    expect(
      await ctx.prisma.appointmentActivity.findUnique({ where: { eventId: first.id } })
    ).toMatchObject({ type: first.type });
  });

  test('клієнтський маршрут: без дати → 400; неіснуючий → 404; без сесії → 401', async () => {
    await expectClientRouteErrors(ctx, bookingId, token);
  });
});
