import {
  BOOKED_EVENT_TYPE,
  SendBookingConfirmation,
  confirmationEvent,
  makeConfirmationDeps,
} from './send-booking-confirmation.fakes';

// Skip-семантика розширення каналу: skipped = «одержувача вибраного каналу
// не існує» (свідома відмова, журнал займає eventId). Вимкнений канал —
// окремий кейс у send-booking-confirmation.spec.ts.
describe('SendBookingConfirmation skip and retry (T-4608)', () => {
  it('email-канал: немає email локації → skipped, журнал із причиною, листа немає', async () => {
    const deps = makeConfirmationDeps({ channel: 'email', email: null });
    const outcome = await new SendBookingConfirmation(deps).handleOne(confirmationEvent());
    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(deps.email.send).not.toHaveBeenCalled();
    expect(deps.journal.markSent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'evt-1',
        type: BOOKED_EVENT_TYPE,
        recipient: '',
        detail: expect.stringContaining('loc-1'),
      })
    );
  });

  it('email-канал: немає локації взагалі → skipped (локацію могли видалити)', async () => {
    const deps = makeConfirmationDeps({ channel: 'email' });
    (deps.locations.findContacts as jest.Mock).mockResolvedValue(null);
    const outcome = await new SendBookingConfirmation(deps).handleOne(confirmationEvent());
    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(deps.email.send).not.toHaveBeenCalled();
  });

  it('sms-канал: телефон клієнта не резолвиться → skipped', async () => {
    const deps = makeConfirmationDeps({ channel: 'sms', phone: null });
    const outcome = await new SendBookingConfirmation(deps).handleOne(confirmationEvent());
    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(deps.sms.send).not.toHaveBeenCalled();
    expect(deps.journal.markSent).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'sms', recipient: '' })
    );
  });

  it('падіння send НЕ пишеться в журнал — подія лишається для повтору', async () => {
    const deps = makeConfirmationDeps({ failSend: new Error('smtp down') });
    await expect(new SendBookingConfirmation(deps).handleOne(confirmationEvent())).rejects.toThrow(
      'smtp down'
    );
    expect(deps.journal.markSent).not.toHaveBeenCalled();
  });
});
