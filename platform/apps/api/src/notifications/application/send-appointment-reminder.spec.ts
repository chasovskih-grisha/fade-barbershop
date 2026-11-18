// Споживач нагадування (T-080): фільтрація типів, ідемпотентність за журналом,
// відписка каналу, відмова без телефону та ретрай. Планування —
// schedule-appointment-reminder.spec.ts.
import { SendAppointmentReminder } from './send-appointment-reminder';
import { makeReminderFakes } from './appointment-reminder.fakes';
import { dueEvent, senderDeps } from './appointment-reminder.events.fakes';

const run = (fakes: ReturnType<typeof makeReminderFakes>, event = dueEvent()) =>
  new SendAppointmentReminder(senderDeps(fakes)).handleOne(event);

describe('SendAppointmentReminder: фільтрація подій', () => {
  it('чужі типи ігнорує без SMS і без журналу', async () => {
    const fakes = makeReminderFakes();
    expect(await run(fakes, dueEvent({ type: 'scheduling.appointment.booked' }))).toEqual({
      handled: false,
      reason: 'ignored',
    });
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });

  it('дубль за eventId: без SMS і без повторного запису', async () => {
    const fakes = makeReminderFakes({ handled: true });
    expect(await run(fakes)).toEqual({ handled: false, reason: 'duplicate' });
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });
});

describe('SendAppointmentReminder: доставка', () => {
  it('SMS клієнту з часом, місцем і послугою + запис журналу', async () => {
    const fakes = makeReminderFakes();
    expect(await run(fakes)).toEqual({
      handled: true,
      reason: 'sent',
      recipient: '+380501112233',
    });

    expect(fakes.smsSent[0]?.to).toBe('+380501112233');
    expect(fakes.smsSent[0]?.text).toContain('нагадування про візит');
    expect(fakes.smsSent[0]?.text).toContain('FADE Podil');
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ eventId: 'evt-due-1', channel: 'sms', recipient: '+380501112233' })
    );
  });

  it('падіння SMS НЕ пишеться в журнал — рядок лишається для повтору', async () => {
    const fakes = makeReminderFakes({ failSend: new Error('sms gateway down') });
    await expect(run(fakes)).rejects.toThrow('sms gateway down');
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });
});

describe('SendAppointmentReminder: свідомі відмови', () => {
  it('канал none (відписка оператора) → skipped, без SMS', async () => {
    const fakes = makeReminderFakes({ channel: 'none' });
    expect(await run(fakes)).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ channel: 'none', detail: expect.stringContaining('вимкнено') })
    );
  });

  it('немає телефону клієнта → skipped із причиною', async () => {
    const fakes = makeReminderFakes({ phone: null });
    expect(await run(fakes)).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ recipient: '', detail: expect.stringContaining('телефону') })
    );
  });

  it('клієнт відмовився від нагадувань (reminderOptOut) → skipped', async () => {
    const fakes = makeReminderFakes({ reminderOptOut: true });
    expect(await run(fakes)).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ recipient: '', detail: expect.stringContaining('відмовився') })
    );
  });

  it('клієнт вимкнув SMS (smsEnabled: false) → skipped', async () => {
    const fakes = makeReminderFakes({ smsEnabled: false });
    expect(await run(fakes)).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journalRows[0]).toEqual(
      expect.objectContaining({ recipient: '', detail: expect.stringContaining('відмовився') })
    );
  });
});
