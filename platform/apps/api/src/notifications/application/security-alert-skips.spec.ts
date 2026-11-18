// NewDeviceAlert (T-4422): коли сповіщення НЕ надсилається — чужі типи,
// дубль за eventId, відсутність каналів і відсутність токенів інших пристроїв.
// Доставка — security-alert.spec.ts.
import { NewDeviceAlert } from './security-alert';
import type { SecurityAlertEvent } from './security-alert-ports';
import { setup, startedEvent } from './security-alert.fakes';

describe('NewDeviceAlert: пропуски', () => {
  it('чужі типи подій ігнорує без відправок і журналів', async () => {
    const { deps, sent, pushed } = setup('client@example.com');

    const outcome = await new NewDeviceAlert(deps).handleOne({
      ...startedEvent(),
      type: 'scheduling.appointment.booked' as SecurityAlertEvent['type'],
    });

    expect(outcome).toEqual({ handled: false, reason: 'ignored' });
    expect(sent).toHaveLength(0);
    expect(pushed).toHaveLength(0);
    expect(deps.journal.markSent).not.toHaveBeenCalled();
  });

  it('дубль за eventId — без повторної відправки', async () => {
    const { deps, sent } = setup('client@example.com');
    (deps.journal.alreadyHandled as jest.Mock).mockResolvedValue(true);

    const outcome = await new NewDeviceAlert(deps).handleOne(startedEvent());

    expect(outcome).toEqual({ handled: false, reason: 'duplicate' });
    expect(sent).toHaveLength(0);
  });

  it('жодного каналу (немає email і токенів) → skipped, журнал із причиною', async () => {
    const { deps, sent, pushed, journalRows } = setup(null, []);

    const outcome = await new NewDeviceAlert(deps).handleOne(startedEvent());

    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(sent).toHaveLength(0);
    expect(pushed).toHaveLength(0);
    expect(journalRows[0]).toMatchObject({
      eventId: 'evt-1',
      channel: 'none',
      detail: expect.stringContaining('не задано'),
    });
  });

  it('немає токенів інших пристроїв — канал не дозволений, push не викликаємо', async () => {
    const { deps, pushed } = setup('client@example.com', []);

    await new NewDeviceAlert(deps).handleOne(startedEvent());

    expect(deps.push.send).toHaveBeenCalledTimes(0);
    expect(pushed).toHaveLength(0);
  });
});
