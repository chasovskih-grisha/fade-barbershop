// Канали доставки підтверджень (T-4608, MNG-ADM-18): email → локація, sms →
// клієнт, both → обидва, none → свідома вимкнена доставка. Skip при
// відсутності одержувача і ретрай — send-booking-confirmation-skip.spec.ts.
import {
  SendBookingConfirmation,
  confirmationEvent,
  makeConfirmationDeps,
} from './send-booking-confirmation.fakes';

describe('SendBookingConfirmation: канал email (дефолт)', () => {
  it('лист на email локації, SMS немає; час у Europe/Kyiv', async () => {
    const fakes = makeConfirmationDeps({ channel: 'email' });
    const outcome = await new SendBookingConfirmation(fakes.deps).handleOne(confirmationEvent());

    expect(outcome).toMatchObject({ handled: true, reason: 'sent', recipient: 'podil@fade.dev' });
    expect(fakes.sent[0]).toMatchObject({ to: 'podil@fade.dev' });
    expect(fakes.sent[0]?.subject).toContain('FADE');
    // 2026-10-05T10:00Z = 13:00 у Europe/Kyiv (літо)
    expect(fakes.sent[0]?.text).toMatch(/13:00/);
    expect(fakes.sent[0]?.text).toContain('записано');
    expect(fakes.sent[0]?.text).toContain('FADE Podil');
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'evt-1', channel: 'email', recipient: 'podil@fade.dev' })
    );
  });

  it('канал email, але email локації немає → skipped (див. skip-спеку)', async () => {
    const fakes = makeConfirmationDeps({ channel: 'email', email: null });
    const outcome = await new SendBookingConfirmation(fakes.deps).handleOne(confirmationEvent());

    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.email.send).not.toHaveBeenCalled();
  });
});

describe('SendBookingConfirmation: канал sms', () => {
  it('SMS клієнту за телефоном з Booking→User, email немає', async () => {
    const fakes = makeConfirmationDeps({ channel: 'sms' });
    const outcome = await new SendBookingConfirmation(fakes.deps).handleOne(confirmationEvent());

    expect(outcome).toMatchObject({ handled: true, reason: 'sent', recipient: '+380501112233' });
    expect(fakes.sms.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: '+380501112233', text: expect.stringContaining('FADE') })
    );
    expect(fakes.clients.findPhoneByAppointmentId).toHaveBeenCalledWith('apt-1');
    expect(fakes.email.send).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'sms', recipient: '+380501112233' })
    );
  });
});

describe('SendBookingConfirmation: канал both', () => {
  it('email і SMS, в журналі обидва одержувачі', async () => {
    const fakes = makeConfirmationDeps({ channel: 'both' });
    const outcome = await new SendBookingConfirmation(fakes.deps).handleOne(confirmationEvent());

    expect(outcome).toMatchObject({ handled: true, reason: 'sent' });
    expect(fakes.sent[0]?.to).toBe('podil@fade.dev');
    expect(fakes.smsSent[0]?.to).toBe('+380501112233');
    expect(fakes.journal.markSent).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'both', recipient: 'podil@fade.dev, +380501112233' })
    );
  });
});

describe('SendBookingConfirmation: канал none (вимкнено в адмінці)', () => {
  it('нічого не відправляється, журнал із причиною', async () => {
    const fakes = makeConfirmationDeps({ channel: 'none' });
    const outcome = await new SendBookingConfirmation(fakes.deps).handleOne(confirmationEvent());

    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(fakes.email.send).not.toHaveBeenCalled();
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'none', detail: expect.stringContaining('вимкнено') })
    );
  });
});
