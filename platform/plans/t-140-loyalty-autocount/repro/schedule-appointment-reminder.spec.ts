// Планувальник нагадування (T-080): що планується, що свідомо пропускається
// і коли рядок не закривається журналом (ретрай). Фільтр подій/дублі —
// send-appointment-reminder.spec.ts, текст — appointment-reminder-sms.spec.ts.
import { ScheduleAppointmentReminder } from './schedule-appointment-reminder';
import { NOW, VISIT_START, plannerDeps, visitEvent } from './appointment-reminder.events.fakes';

const run = (fakes: ReturnType<typeof makeReminderFakes>, event = visitEvent()) =>
  new ScheduleAppointmentReminder(plannerDeps(fakes)).handleOne(event);

describe('ScheduleAppointmentReminder: фільтрація подій', () => {
  it('чужі типи ігнорує без планування і без журналу', async () => {
    const fakes = makeReminderFakes();
    expect(await run(fakes, visitEvent({ type: 'crm.loyalty.visits_changed' }))).toEqual({
      handled: false,
      reason: 'ignored',
    });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });

  it('дубль за eventId не планує повторно', async () => {
    const fakes = makeReminderFakes({ handled: true });
    expect(await run(fakes)).toEqual({ handled: false, reason: 'duplicate' });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
  });
});

describe('ScheduleAppointmentReminder: планування', () => {
  it('booked → рядок reminder.due з часом спрацювання start − leadMinutes', async () => {
    const fakes = makeReminderFakes({ leadMinutes: 120 });
    expect(await run(fakes)).toEqual({ handled: true, reason: 'sent' });

    expect(fakes.scheduled).toHaveLength(1);
    expect(fakes.scheduled[0]?.appointmentId).toBe('apt-1');
    expect(fakes.scheduled[0]?.fireAt.toISOString()).toBe('2026-10-02T08:00:00.000Z'); // start − 120 хв
    expect(fakes.scheduled[0]?.payload).toEqual({
      appointmentId: 'apt-1',
      fireAt: fakes.scheduled[0]?.fireAt.toISOString(),
      start: VISIT_START,
      locationId: 'loc-1',
      serviceId: 'svc-1',
    });
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ eventId: 'evt-1:reminder-schedule', channel: 'sms' })
    );
  });

  it('rescheduled бере newStart і скасовує старе ще не спрацьоване нагадування', async () => {
    const fakes = makeReminderFakes();
    const outcome = await run(
      fakes,
      visitEvent({
        id: 'evt-moved-1',
        type: 'scheduling.appointment.rescheduled',
        payload: { newStart: VISIT_START, oldStart: '2026-09-20T10:00:00.000Z' },
      })
    );

    expect(outcome).toEqual({ handled: true, reason: 'sent' });
    expect(fakes.cancelled).toEqual(['apt-1']);
    expect(fakes.scheduled[0]?.payload.start).toBe(VISIT_START);
  });

  it('журнал планувальника іменований: не колізує з eventId підтвердження', async () => {
    // NotificationRecord.eventId унікальний, а подію візиту читають два
    // споживачі — без суфікса планувальник побачив би «дубль» підтвердження.
    const fakes = makeReminderFakes();
    await run(fakes);
    // Рядок має існувати (objectContaining падає на undefined) і мати суфікс.
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ eventId: 'evt-1:reminder-schedule' })
    );
  });

  it('падіння запису НЕ пишеться в журнал — подія лишається для повтору', async () => {
    const fakes = makeReminderFakes({ failSchedule: new Error('db down') });
    await expect(run(fakes)).rejects.toThrow('db down');
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });
});

describe('ScheduleAppointmentReminder: свідомі пропуски', () => {
  it('канал none (відписка оператора) → без планування, журнал із причиною', async () => {
    const fakes = makeReminderFakes({ channel: 'none' });
    expect(await run(fakes)).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ channel: 'none', detail: expect.stringContaining('вимкнено') })
    );
  });

  it('подія без коректного start → skipped, без планування', async () => {
    const fakes = makeReminderFakes();
    const broken = visitEvent({ payload: { locationId: 'loc-1', start: 'не-дата' } });
    expect(await run(fakes, broken)).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
  });

  it('візит занадто близько (менше нижньої межі) → skipped, без планування', async () => {
    const fakes = makeReminderFakes({ leadMinutes: 60 });
    const soon = new Date(NOW.getTime() + 5 * 60_000).toISOString();
    expect(await run(fakes, visitEvent({ payload: { start: soon } }))).toEqual({
      handled: true,
      reason: 'skipped',
    });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
  });

  it('візит у минулому → skipped, без планування', async () => {
    const fakes = makeReminderFakes();
    const past = new Date(NOW.getTime() - 60 * 60_000).toISOString();
    expect(await run(fakes, visitEvent({ payload: { start: past } }))).toEqual({
      handled: true,
      reason: 'skipped',
    });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
  });
});
