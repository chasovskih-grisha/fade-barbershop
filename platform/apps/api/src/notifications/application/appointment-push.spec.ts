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
      pushEvent('scheduling.appointment.rescheduled', { newStart: '2026-10-06T12:00:00.000Z' })
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
    expect(pushed[0]?.body).toContain('зателефонуйте');
  });

  // T-4616b: барбер недоступний — клієнт бачить причину і як записатися знову,
  // без «дзвоніть нам» (рецепція не обдзвонює кожен рядок) і без діагнозу.
  it('cancelled барбером недоступним → причина і шлях до нового часу', async () => {
    const { deps, pushed } = makePushFakes();

    await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.cancelled', {
        appointmentId: 'apt-1',
        reason: 'barber unavailable',
      })
    );

    expect(pushed[0]?.title).toBe('FADE: візит скасовано');
    expect(pushed[0]?.body).toContain('Барбер недоступний');
    expect(pushed[0]?.body).toContain('Оберіть новий час');
    expect(pushed[0]?.body).not.toContain('зателефонуйте');
  });

  // Реальний payload перенесення несе newStart (mover), а не start: без цього
  // клієнт отримував «перенесено» без нового часу (T-4616b).
  it('rescheduled → називає новий час із newStart', async () => {
    const { deps, pushed } = makePushFakes();

    await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.rescheduled', {
        newStart: '2026-11-16T12:00:00.000Z',
      })
    );

    expect(pushed[0]?.body).toContain('перенесено на');
    expect(pushed[0]?.body).toContain('16 листопада 2026');
    expect(pushed[0]?.body).toContain('14:00');
  });

  // Перенесення на іншого майстра називає і його (T-4616b).
  it('rescheduled на іншого барбера → називає майстра', async () => {
    const { deps, pushed } = makePushFakes({ barberName: 'Олег' });

    await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.rescheduled', {
        newStart: '2026-11-16T12:00:00.000Z',
        barberId: 'barber-2',
      })
    );

    expect(pushed[0]?.body).toBe(
      'Ваш візит перенесено на 16 листопада 2026 р. о 14:00, майстер Олег.'
    );
  });

  it('rescheduled без імені барбера → текст без «майстер»', async () => {
    const { deps, pushed } = makePushFakes({ barberName: null });

    await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.rescheduled', {
        newStart: '2026-11-16T12:00:00.000Z',
        barberId: 'barber-2',
      })
    );

    expect(pushed[0]?.body).not.toContain('майстер');
    expect(pushed[0]?.body).toContain('16 листопада 2026');
  });

  it('без start → текст без дати (payload не несе часу)', async () => {
    const { deps, pushed } = makePushFakes();

    await new AppointmentPushNotification(deps).handleOne(
      pushEvent('scheduling.appointment.booked')
    );

    expect(pushed[0]?.body).toBe('Ваш візит записано.');
  });
});
