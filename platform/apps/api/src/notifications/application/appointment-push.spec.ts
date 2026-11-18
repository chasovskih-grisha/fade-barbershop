// AppointmentPushNotification (T-080): доставка push про візит на пристрої
// клієнта (booked/rescheduled/cancelled), український текст, журнал 'push'.
// Пропуски (ignored/duplicate/no-client/відписка/без пристроїв) —
// appointment-push-skips.spec.ts.
import { AppointmentPushNotification } from './appointment-push';
import { OTHER_TOKEN, SECOND_TOKEN, makePushFakes, pushEvent } from './appointment-push.fakes';

describe('AppointmentPushNotification: доставка', () => {
  it('booked → push на пристрої клієнта з часом візиту, журнал push', async () => {
    const { deps, pushed, journalRows } = makePushFakes({ tokens: [OTHER_TOKEN] });

    const outcome = await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.booked', { start: '2026-10-05T10:00:00.000Z' })
    );

    expect(outcome).toEqual({ handled: true, reason: 'sent', recipient: '1 пристроїв' });
    expect(deps.clients.findClientIdByAppointmentId).toHaveBeenCalledWith('apt-1');
    expect(pushed[0]).toMatchObject({ token: OTHER_TOKEN, title: 'FADE: візит записано' });
    expect(pushed[0]?.body).toContain('записано');
    expect(journalRows[0]).toMatchObject({ eventId: 'evt-1', channel: 'push' });
  });

  it('кілька пристроїв → одне повідомлення кожному, журнал рахує пристрої', async () => {
    const { deps, pushed, journalRows } = makePushFakes({
      tokens: [OTHER_TOKEN, SECOND_TOKEN],
    });

    await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.rescheduled', { start: '2026-10-06T12:00:00.000Z' })
    );

    expect(pushed).toHaveLength(2);
    expect(pushed[0]?.title).toBe('FADE: візит перенесено');
    expect(pushed[1]?.token).toBe(SECOND_TOKEN);
    expect(journalRows[0]).toMatchObject({ channel: 'push', recipient: '2 пристроїв' });
  });

  it('cancelled → короткий текст скасування без часу', async () => {
    const { deps, pushed } = makePushFakes();

    await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.cancelled')
    );

    expect(pushed[0]?.title).toBe('FADE: візит скасовано');
    expect(pushed[0]?.body).toContain('скасовано');
  });

  it('без start → текст без дати (payload не несе часу)', async () => {
    const { deps, pushed } = makePushFakes();

    await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.booked')
    );

    expect(pushed[0]?.body).toBe('Ваш візит записано.');
  });
});
