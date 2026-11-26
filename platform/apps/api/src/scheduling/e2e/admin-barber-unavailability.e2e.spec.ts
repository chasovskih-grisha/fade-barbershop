// T-4616a e2e (Postgres): admin marks an unavailable interval, sees the visit
// as one open conflict, resolves it by cancel, and a replay is a no-op.
import { HttpStatus } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import request from 'supertest';
import { postWithRetry } from '@fade/test-utils';
import { lifecycleSuite, type LifecycleSuite } from './appointment-lifecycle.suite';

const DATE = '2027-01-04'; // Monday: seedLifecycle opens Monday 08:00-18:00.
const INTERVAL = { start: `${DATE}T09:00:00.000Z`, end: `${DATE}T12:00:00.000Z` };

describe('Admin barber unavailability (e2e, Postgres)', () => {
  let ctx: LifecycleSuite;
  let bookingId = '';
  let conflictId = '';

  const post = (path: string, body: object) =>
    request(ctx.app.getHttpServer()).post(path).send(body);
  const list = () =>
    request(ctx.app.getHttpServer()).get(`/admin/shift-conflicts?barberId=${ctx.ids.barber1}`);

  beforeAll(async () => {
    ctx = await lifecycleSuite({ admin: true, adminId: uuidv7() });
    const booking = await postWithRetry((body) => post('/admin/bookings', body), {
      barberId: ctx.ids.barber1,
      locationId: ctx.ids.location,
      date: DATE,
      start: '10:00',
      end: '10:30',
      serviceDuration: 30,
    });
    bookingId = booking.body.id;
  });

  afterAll(async () => {
    if (!ctx) return;
    await ctx.prisma.shiftConflict.deleteMany({ where: { locationId: ctx.ids.location } });
    await ctx.prisma.barberUnavailability.deleteMany({ where: { barberId: ctx.ids.barber1 } });
    await ctx.cleanup();
  });

  test('mark opens one conflict, list shows it, resolve cancels the visit', async () => {
    const marked = await post(`/admin/barbers/${ctx.ids.barber1}/unavailability`, {
      locationId: ctx.ids.location,
      ...INTERVAL,
      reason: 'training',
    }).expect(HttpStatus.CREATED);
    expect(marked.body.conflictsCreated).toBe(1);

    const conflict = await ctx.prisma.shiftConflict.findFirstOrThrow({ where: { bookingId } });
    conflictId = conflict.id;
    expect(conflict).toMatchObject({ status: 'open', barberId: ctx.ids.barber1, partyId: null });

    const open = await list().expect(HttpStatus.OK);
    expect(open.body).toEqual([
      expect.objectContaining({
        id: conflictId,
        bookingId,
        barberId: ctx.ids.barber1,
        start: `${DATE}T10:00:00.000Z`,
        end: '2027-01-04T10:30:00.000Z',
        otherBarberAvailable: false,
      }),
    ]);

    const resolved = await post(`/admin/shift-conflicts/${conflictId}/resolve`, {
      decision: 'cancel',
    }).expect(HttpStatus.OK);
    expect(resolved.body).toMatchObject({
      changed: true,
      conflict: { id: conflictId, status: 'closed', resolution: 'cancelled' },
    });
    expect((await ctx.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })).status).toBe(
      'cancelled'
    );
    expect((await list().expect(HttpStatus.OK)).body).toEqual([]);
  });

  test('replaying a closed conflict is a no-op on both resolve routes', async () => {
    const eventWhere = {
      aggregateType: 'appointment',
      aggregateId: (await ctx.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } }))
        .appointmentId as string,
      type: 'scheduling.appointment.cancelled',
    };
    const eventsBefore = await ctx.prisma.outboxMessage.count({ where: eventWhere });

    const one = await post(`/admin/shift-conflicts/${conflictId}/resolve`, {
      decision: 'cancel',
    }).expect(HttpStatus.OK);
    expect(one.body).toMatchObject({ changed: false, conflict: { status: 'closed' } });

    const batch = await post('/admin/shift-conflicts/resolve-batch', {
      decisions: [{ conflictId, decision: 'cancel' }],
    }).expect(HttpStatus.OK);
    expect(batch.body.outcomes).toEqual([{ conflictId, status: 'resolved', changed: false }]);

    expect(await ctx.prisma.outboxMessage.count({ where: eventWhere })).toBe(eventsBefore);
  });
});
