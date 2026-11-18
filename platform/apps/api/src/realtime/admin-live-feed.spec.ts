// Шина живих подій адмінки: опубліковане сповіщення дістає кожен підписник,
// після відписки нових не приходить.
import { AdminLiveFeed } from './admin-live-feed';

describe('AdminLiveFeed', () => {
  it('роздає опубліковане сповіщення всім підписникам', () => {
    const feed = new AdminLiveFeed();
    const seen: unknown[] = [];
    const subscription = feed.stream$.subscribe((notice) => seen.push(notice));

    feed.publish({ type: 'scheduling.appointment.booked', appointmentId: 'apt-1' });
    feed.publish({ type: 'scheduling.appointment.cancelled', appointmentId: 'apt-2' });

    expect(seen).toEqual([
      { type: 'scheduling.appointment.booked', appointmentId: 'apt-1' },
      { type: 'scheduling.appointment.cancelled', appointmentId: 'apt-2' },
    ]);
    subscription.unsubscribe();
  });

  it('після відписки нові сповіщення не приходять', () => {
    const feed = new AdminLiveFeed();
    const seen: unknown[] = [];
    const subscription = feed.stream$.subscribe((notice) => seen.push(notice));
    subscription.unsubscribe();

    feed.publish({ type: 'scheduling.appointment.started', appointmentId: 'apt-3' });

    expect(seen).toEqual([]);
  });
});
