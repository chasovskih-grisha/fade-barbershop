import { AppointmentActivityProjection } from './appointment-activity.projection';
import { bookedEvent, journal } from './appointment-activity.projection.fakes';

describe('AppointmentActivityProjection (еталон T-042c)', () => {
  it('перша доставка застосовує подію; повторна — duplicate без ефектів', async () => {
    const tx = journal([]);
    const projection = new AppointmentActivityProjection({} as never);
    expect(await projection.handleOne(bookedEvent, tx as never)).toMatchObject({
      handled: true,
      reason: 'applied',
    });
    expect(tx.appointmentActivity.upsert).toHaveBeenCalledTimes(2); // журнал + проекція
    expect(await projection.handleOne(bookedEvent, tx as never)).toMatchObject({
      handled: false,
      reason: 'duplicate',
    });
    expect(tx.appointmentActivity.upsert).toHaveBeenCalledTimes(2); // duplicate — записів нема
  });

  it('чужі події (не scheduling.appointment.*) ігноруються повністю', async () => {
    const tx = journal([]);
    const projection = new AppointmentActivityProjection({} as never);
    expect(
      await projection.handleOne({ ...bookedEvent, type: 'locations.location.opened' }, tx as never)
    ).toMatchObject({
      handled: false,
      reason: 'ignored',
    });
    expect(tx.appointmentActivity.upsert).not.toHaveBeenCalled();
  });

  it('штучна червона доставка: збій apply → транзакція відкочується → повтор застосовує', async () => {
    const tx = journal([]);
    // Падіння apply всередині $transaction відкочує журнал — повтор застосовує.
    const failingTx = journal([]);
    const failing = new AppointmentActivityProjection({} as never);
    // prettier-ignore
    const failingRelay = { $transaction: async (work: (tx: object) => Promise<unknown>) => { const outcome = await work(failingTx); throw new Error('simulated delivery failure'); return outcome; } };
    // prettier-ignore
    await expect(failingRelay.$transaction((txArg: object) => failing.handleOne(bookedEvent, txArg as never))).rejects.toThrow('simulated delivery failure');
    expect(failingTx.appointmentActivity.upsert).toHaveBeenCalled();
    // prettier-ignore
    await expect(new AppointmentActivityProjection({} as never).handleOne(bookedEvent, tx as never)).resolves.toMatchObject({ handled: true, reason: 'applied' });
  });

  it('payload з W3C-каріюванням (traceparent, T-4204) не ламає обробку', async () => {
    const tx = journal([]);
    const projection = new AppointmentActivityProjection({} as never);
    const withCarrier = {
      ...bookedEvent,
      payload: {
        appointmentId: 'apt-1',
        barberId: 'b1',
        traceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`,
      },
    };
    await expect(projection.handleOne(withCarrier, tx as never)).resolves.toMatchObject({
      handled: true,
      reason: 'applied',
    });
  });
});
