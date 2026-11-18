import {
  AppointmentActivityProjection,
  OutboxLagProbe,
  type OutboxMessageLike,
} from './appointment-activity.projection';
import { journal, prismaWith } from './appointment-activity.projection.fakes';

describe('AppointmentActivityProjection lag and reschedule', () => {
  it('OutboxLagProbe рахує pending і вік найстарішої', async () => {
    const probe = new OutboxLagProbe(prismaWith({}) as never);
    const lag = await probe.lag();
    expect(lag.pending).toBe(2);
    expect(lag.oldestPendingMs).toBeGreaterThanOrEqual(5000);
  });

  it('rescheduled (T-4533): подія з ISO старим/новим часом застосовується в журнал, повторна — duplicate', async () => {
    const tx = journal([]);
    const projection = new AppointmentActivityProjection({} as never);
    // prettier-ignore
    const rescheduled: OutboxMessageLike = { id: 'evt-9', type: 'scheduling.appointment.rescheduled', aggregateId: 'apt-9', payload: { appointmentId: 'apt-9', actorId: 'client-1', actorRole: 'client', oldStart: '2026-11-09T10:00:00.000Z', oldEnd: '2026-11-09T10:30:00.000Z', newStart: '2026-11-16T12:00:00.000Z', newEnd: '2026-11-16T12:30:00.000Z' } };
    // prettier-ignore
    await expect(projection.handleOne(rescheduled, tx as never)).resolves.toMatchObject({ handled: true, reason: 'applied' });
    // Проекція «current» для запису оновлена типом події перенесення.
    // prettier-ignore
    const currentCall = tx.appointmentActivity.upsert.mock.calls.find((c: unknown[]) => (c[0] as { where: { eventId: string } }).where.eventId === 'apt-9:current');
    // prettier-ignore
    expect(currentCall?.[0]).toMatchObject({ update: { type: 'scheduling.appointment.rescheduled' } });
    // prettier-ignore
    await expect(projection.handleOne(rescheduled, tx as never)).resolves.toMatchObject({ handled: false, reason: 'duplicate' });
  });
});
