// SSE-контролер: кожне сповіщення шини перетворюється на подію 'appointment'
// з тим самим тілом — клієнт лише за сигналом перечитує екран.
import { firstValueFrom, Subject } from 'rxjs';
import { AdminLiveController, ADMIN_LIVE_EVENT } from './admin-live.controller';
import type { AdminLiveFeed } from './admin-live-feed';
import type { AdminLiveNotice } from './admin-live-types';

function makeController() {
  const subject = new Subject<AdminLiveNotice>();
  const feed = { stream$: subject.asObservable() } as unknown as AdminLiveFeed;
  return { controller: new AdminLiveController(feed), subject };
}

describe('AdminLiveController (SSE)', () => {
  it('мапить сповіщення шини в SSE-подію appointment із тілом сигналу', async () => {
    const { controller, subject } = makeController();
    const next = firstValueFrom(controller.events());
    const notice: AdminLiveNotice = {
      type: 'scheduling.appointment.booked',
      appointmentId: 'apt-1',
    };

    subject.next(notice);

    expect(ADMIN_LIVE_EVENT).toBe('appointment');
    await expect(next).resolves.toEqual({ type: 'appointment', data: notice });
  });

  it('кожен підписник отримує власний потік (нові клієнти незалежні)', async () => {
    const { controller, subject } = makeController();
    const first = firstValueFrom(controller.events());
    const second = firstValueFrom(controller.events());

    subject.next({ type: 'scheduling.appointment.confirmed', appointmentId: 'apt-9' });

    await expect(first).resolves.toMatchObject({ data: { appointmentId: 'apt-9' } });
    await expect(second).resolves.toMatchObject({ data: { appointmentId: 'apt-9' } });
  });
});
