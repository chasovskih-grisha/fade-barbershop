// Таблиця маршрутизації типів подій до споживачів (T-080, T-4462): які консюмери
// отримують подію і в якому порядку. Алгоритм проходу релея — outbox-relay.spec.ts.
import { consumersFor } from './outbox-routing';
import { makeConsumers } from './outbox-relay.fakes';

describe('consumersFor: маршрутизація подій', () => {
  const consumers = makeConsumers([]);

  it('booked → підтвердження + планування нагадування + push пристроям', () => {
    expect(consumersFor('scheduling.appointment.booked', consumers)).toEqual([
      consumers.confirmations,
      consumers.schedule,
      consumers.appointmentPush,
    ]);
  });

  it('rescheduled → планувальник + push (перенос без листа підтвердження)', () => {
    expect(consumersFor('scheduling.appointment.rescheduled', consumers)).toEqual([
      consumers.schedule,
      consumers.appointmentPush,
    ]);
  });

  it('cancelled → лише push пристроям (T-080)', () => {
    expect(consumersFor('scheduling.appointment.cancelled', consumers)).toEqual([
      consumers.appointmentPush,
    ]);
  });

  it('reminder.due → доставка нагадування; session.started → сповіщення безпеки', () => {
    expect(consumersFor('notification.reminder.due', consumers)).toEqual([consumers.reminders]);
    expect(consumersFor('identity.session.started', consumers)).toEqual([consumers.alerts]);
  });

  it('loyalty events → loyalty notification consumer', () => {
    expect(consumersFor('loyalty.counter.incremented', consumers)).toEqual([consumers.loyalty]);
    expect(consumersFor('loyalty.free_visit.granted', consumers)).toEqual([consumers.loyalty]);
  });

  it('невідомий тип → без споживачів (релей просто не має кому віддати)', () => {
    expect(consumersFor('crm.loyalty.visits_changed', consumers)).toEqual([]);
  });
});
