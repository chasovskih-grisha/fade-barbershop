// Ядро споживача підтверджень (T-4608): які події брати, ідемпотентність за
// журналом (патерн T-042c). Канали доставки — send-booking-confirmation-channels.spec.ts,
// skip/ретрай — send-booking-confirmation-skip.spec.ts, лист — template-спека.
import { SendBookingConfirmation, confirmationEvent, makeConfirmationDeps } from './send-booking-confirmation.fakes';

describe('SendBookingConfirmation: фільтрація подій', () => {
  it('чужі типи подій ігнорує без відправок і без записів журналу', async () => {
    const fakes = makeConfirmationDeps();
    const outcome = await new SendBookingConfirmation(fakes.deps).handleOne(
      confirmationEvent({ type: 'crm.loyalty.visits_changed' })
    );

    expect(outcome).toEqual({ handled: false, reason: 'ignored' });
    expect(fakes.email.send).not.toHaveBeenCalled();
    expect(fakes.sms.send).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });
});

describe('SendBookingConfirmation: ідемпотентність за журналом', () => {
  it('дубль за eventId: без відправок і без повторного запису', async () => {
    const fakes = makeConfirmationDeps({ handled: true });
    const outcome = await new SendBookingConfirmation(fakes.deps).handleOne(confirmationEvent());

    expect(outcome).toEqual({ handled: false, reason: 'duplicate' });
    expect(fakes.email.send).not.toHaveBeenCalled();
    expect(fakes.journal.markSent).not.toHaveBeenCalled();
  });
});
