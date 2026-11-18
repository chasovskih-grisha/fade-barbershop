// Пропуски push-споживача візиту (T-080): чужий тип → ignored; повтор →
// duplicate; запис без клієнта, відписка клієнта і відсутність пристроїв —
// свідомі відмови (skipped) із записом у журнал, щоб ретрай не спамив.
import { AppointmentPushNotification } from './appointment-push';
import { makePushFakes, pushEvent } from './appointment-push.fakes';

describe('AppointmentPushNotification: пропуски', () => {
  it('невідомий тип → ignored, журнал не пишеться', async () => {
    const { deps, push, journal } = makePushFakes();

    const outcome = await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.completed')
    );

    expect(outcome).toEqual({ handled: false, reason: 'ignored' });
    expect(push.send).not.toHaveBeenCalled();
    expect(journal.markSent).not.toHaveBeenCalled();
  });

  it('повторна доставка → duplicate без push', async () => {
    const { deps, push } = makePushFakes({ handled: true });

    const outcome = await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.booked')
    );

    expect(outcome).toEqual({ handled: false, reason: 'duplicate' });
    expect(push.send).not.toHaveBeenCalled();
  });

  it('запис без клієнта → skipped із журналом (push нема кому слати)', async () => {
    const { deps, push, journalRows } = makePushFakes({ clientId: null });

    const outcome = await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.booked')
    );

    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(push.send).not.toHaveBeenCalled();
    expect(journalRows[0]).toMatchObject({ channel: 'none' });
  });

  it('клієнт вимкнув push у кабінеті → skipped', async () => {
    const { deps, push, journalRows } = makePushFakes({ pushEnabled: false });

    const outcome = await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.booked')
    );

    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(push.send).not.toHaveBeenCalled();
    expect(journalRows[0]?.detail).toContain('push');
  });

  it('немає зареєстрованих пристроїв → skipped', async () => {
    const { deps, push, journalRows } = makePushFakes({ tokens: [] });

    const outcome = await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.booked')
    );

    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(push.send).not.toHaveBeenCalled();
    expect(journalRows[0]?.detail).toContain('пристро');
  });

  it('падіння push прокидається назовні — подія лишається pending', async () => {
    const { deps, journal } = makePushFakes({ failSend: new Error('expo down') });

    await expect(
      new AppointmentPushNotification(deps).handleOne(pushEvent('scheduling.appointment.booked'))
    ).rejects.toThrow('expo down');
    expect(journal.markSent).not.toHaveBeenCalled();
  });
});
