// Планувальник нагадування (T-080): фільтр подій і власне планування
// (booked/rescheduled, іменований журнал, ретрай при падінні запису).
// Свідомі пропуски — schedule-appointment-reminder-skips.spec.ts, текст —
// appointment-reminder-sms.spec.ts. Прогін — runPlanner (спільний хелпер).
import { makeReminderFakes } from './appointment-reminder.fakes';
import { VISIT_START, runPlanner, visitEvent } from './appointment-reminder.events.fakes';

describe('ScheduleAppointmentReminder: фільтрація подій', () => {
  it('чужі типи ігнорує без планування і без журналу', async () => {
    const fakes = makeReminderFakes();

    expect(await runPlanner(fakes, visitEvent({ type: 'crm.loyalty.visits_changed' }))).toEqual({
      handled: false,
      reason: 'ignored',
    });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });

  it('дубль за eventId не планує повторно', async () => {
    const fakes = makeReminderFakes({ handled: true });

    expect(await runPlanner(fakes)).toEqual({ handled: false, reason: 'duplicate' });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
  });
});

describe('ScheduleAppointmentReminder: планування', () => {
  it('booked → рядок reminder.due з часом спрацювання start − leadMinutes', async () => {
    const fakes = makeReminderFakes({ leadMinutes: 120 });

    expect(await runPlanner(fakes)).toEqual({ handled: true, reason: 'sent' });
    expect(fakes.scheduled[0]?.appointmentId).toBe('apt-1');
    // 2026-10-02T10:00 − 120 хв
    expect(fakes.scheduled[0]?.fireAt.toISOString()).toBe('2026-10-02T08:00:00.000Z');
    expect(fakes.scheduled[0]?.payload).toEqual({
      appointmentId: 'apt-1',
      fireAt: fakes.scheduled[0]?.fireAt.toISOString(),
      start: VISIT_START,
      locationId: 'loc-1',
      serviceId: 'svc-1',
    });
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ eventId: 'evt-booked-1:reminder-schedule', channel: 'sms' })
    );
  });

  it('rescheduled бере newStart і скасовує старе ще не спрацьоване нагадування', async () => {
    const fakes = makeReminderFakes();

    const outcome = await runPlanner(
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

  it('журнал планувальника іменований — не колізує з eventId підтвердження', async () => {
    // NotificationRecord.eventId унікальний, а подію візиту читають два
    // споживачі: без суфікса планувальник бачив би «дубль» підтвердження.
    const fakes = makeReminderFakes();

    await runPlanner(fakes);

    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ eventId: 'evt-booked-1:reminder-schedule' })
    );
  });

  it('падіння запису НЕ пишеться в журнал — подія лишається для повтору', async () => {
    const fakes = makeReminderFakes({ failSchedule: new Error('db down') });

    await expect(runPlanner(fakes)).rejects.toThrow('db down');
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });
});
