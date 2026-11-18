// Свідомі пропуски планувальника нагадування (T-080): канал none,
// невалідний start, візит занадто близько й у минулому — рядок не планується,
// а журнал фіксує причину. Планування й фільтр — schedule-appointment-reminder.spec.ts.
import { makeReminderFakes } from './appointment-reminder.fakes';
import { NOW, runPlanner, visitEvent } from './appointment-reminder.events.fakes';

describe('ScheduleAppointmentReminder: свідомі пропуски', () => {
  it('канал none (відписка оператора) → без планування, журнал із причиною', async () => {
    const fakes = makeReminderFakes({ channel: 'none' });

    expect(await runPlanner(fakes)).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ channel: 'none', detail: expect.stringContaining('вимкнено') })
    );
  });

  it('подія без коректного start → skipped, без планування', async () => {
    const fakes = makeReminderFakes();

    const broken = visitEvent({ payload: { locationId: 'loc-1', start: 'не-дата' } });

    expect(await runPlanner(fakes, broken)).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
  });

  it('візит занадто близько (менше нижньої межі) → skipped, без планування', async () => {
    const fakes = makeReminderFakes({ leadMinutes: 60 });

    const soon = new Date(NOW.getTime() + 5 * 60_000).toISOString();

    expect(await runPlanner(fakes, visitEvent({ payload: { start: soon } }))).toEqual({
      handled: true,
      reason: 'skipped',
    });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
  });

  it('візит у минулому → skipped, без планування', async () => {
    const fakes = makeReminderFakes();

    const past = new Date(NOW.getTime() - 60 * 60_000).toISOString();

    expect(await runPlanner(fakes, visitEvent({ payload: { start: past } }))).toEqual({
      handled: true,
      reason: 'skipped',
    });
    expect(fakes.schedule.schedule).not.toHaveBeenCalled();
  });
});
