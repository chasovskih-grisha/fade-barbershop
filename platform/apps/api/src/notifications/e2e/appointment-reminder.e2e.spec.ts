// E2E нагадування про візит (T-080, Postgres): подія візиту в outbox →
// релей планує відкладене «notification.reminder.due», не бере його до
// availableAt, а після спрацювання закриває рядок і пише журнал. Канал none —
// операторська відписка, тому SMS не надсилається (Mailpit у CI не гарантований).
// Стенд — visit-reminder.fixture.ts; дані — рядки БД, без HTTP.
import {
  LEAD_MINUTES,
  VISIT_START,
  openVisitReminder,
  type VisitReminder,
} from './visit-reminder.fixture';

describe('Нагадування про візит (e2e, Postgres, T-080)', () => {
  let visit: VisitReminder;

  beforeAll(async () => {
    visit = await openVisitReminder();
  });
  afterAll(() => visit.close());
  beforeEach(() => visit.begin());
  afterEach(() => visit.cleanup());

  test('релей планує нагадування на start − leadMinutes і не бере його до часу', async () => {
    const id = await visit.bookEvent();
    await visit.relay.poll();

    const [row] = await visit.relay.reminderRows(visit.appointmentId);
    expect(row?.availableAt?.toISOString()).toBe(
      new Date(VISIT_START.getTime() - LEAD_MINUTES * 60_000).toISOString()
    );
    expect(row?.publishedAt).toBeNull();

    // Другий прохід не дублює: журнал планувальника вже зайняв eventId.
    await visit.relay.poll();
    expect(await visit.relay.reminderRows(visit.appointmentId)).toHaveLength(1);

    const planned = await visit.relay.prisma.notificationRecord.findUnique({
      where: { eventId: `${id}:reminder-schedule` },
    });
    expect(planned?.type).toBe('scheduling.appointment.booked');
  });

  test('після спрацювання рядок закривається; канал none — без SMS, із причиною', async () => {
    await visit.bookEvent();
    await visit.relay.poll();
    const [row] = await visit.relay.reminderRows(visit.appointmentId);
    if (!row) throw new Error('reminder row missing');
    visit.remember([row.id]);

    // Час настав: переносимо availableAt у минуле (інакше e2e чекав би добу).
    await visit.relay.prisma.outboxMessage.update({
      where: { id: row.id },
      data: { availableAt: new Date(Date.now() - 60_000) },
    });
    await visit.relay.setSettings({ channel: 'none', leadMinutes: LEAD_MINUTES });
    await visit.relay.poll();

    const closed = await visit.relay.prisma.outboxMessage.findUnique({ where: { id: row.id } });
    expect(closed?.publishedAt).not.toBeNull();
    const record = await visit.relay.prisma.notificationRecord.findUnique({
      where: { eventId: row.id },
    });
    expect(record?.channel).toBe('none');
    expect(record?.detail).toContain('вимкнено');
  });

  test('перенесення скасовує ще не спрацьоване нагадування і планує нове', async () => {
    await visit.bookEvent();
    await visit.relay.poll();
    const [stale] = await visit.relay.reminderRows(visit.appointmentId);
    if (!stale) throw new Error('stale reminder row missing');

    const movedStart = new Date(VISIT_START.getTime() + 60 * 60_000);
    const movedId = await visit.relay.appendVisitEvent({
      appointmentId: visit.appointmentId,
      type: 'scheduling.appointment.rescheduled',
      payload: {
        appointmentId: visit.appointmentId,
        newStart: movedStart.toISOString(),
        oldStart: VISIT_START.toISOString(),
      },
    });
    visit.remember([movedId]);
    await visit.relay.poll();

    const rows = await visit.relay.reminderRows(visit.appointmentId);
    visit.remember(rows.map((r) => r.id));
    expect(rows).toHaveLength(2);
    const cancelled = rows.find((r) => r.id === stale.id);
    const fresh = rows.find((r) => r.id !== stale.id);
    if (!cancelled || !fresh) throw new Error('expected cancelled and fresh rows');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.publishedAt).not.toBeNull();
    expect(fresh.availableAt?.toISOString()).toBe(
      new Date(movedStart.getTime() - LEAD_MINUTES * 60_000).toISOString()
    );
  });
});
