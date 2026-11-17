// Специфікація підписника лояльності (T-140): функціональний рівень піраміди —
// міст outbox-події → use case лічильника з фейковими портами, без БД.
// Перевіряємо резолв клієнта, ігнорування чужих типів/без профілю та
// ідемпотентність повторної доставки (патерн ADR 0009).

import { AppointmentCompletedSubscriber } from './appointment-completed-subscriber';
import { ProcessAppointmentCompletedHandler } from './process-appointment-completed.use-case';
import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { ClientLoyaltyStateRepository, OutboxPublisher } from '../domain/ports';
import type { DomainEvent } from '../domain/domain-event';

class InMemoryStates implements ClientLoyaltyStateRepository {
  readonly store = new Map<string, ClientLoyaltyState>();
  async findByClientId(clientId: string): Promise<ClientLoyaltyState | null> {
    return this.store.get(clientId) ?? null;
  }
  async save(state: ClientLoyaltyState): Promise<void> {
    this.store.set(state.clientId, ClientLoyaltyState.reconstitute(state.propsData));
  }
}

class InMemoryOutbox implements OutboxPublisher {
  readonly events: DomainEvent[] = [];
  async append(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

const at = (iso: string) => new Date(iso);
const completed = (appointmentId: string) => ({
  type: 'scheduling.appointment.completed',
  occurredAt: at('2026-11-10T12:00:00Z'),
  payload: { appointmentId },
});

describe('підписник лояльності на completed-візит (T-140)', () => {
  function setup(threshold: number, clientId: string | null = 'client-1') {
    const states = new InMemoryStates();
    const outbox = new InMemoryOutbox();
    const counter = new ProcessAppointmentCompletedHandler({
      states,
      outbox,
      clock: { now: () => at('2026-11-10T12:00:00Z') },
      threshold,
    });
    const subscriber = new AppointmentCompletedSubscriber({
      clients: { clientIdOf: async () => clientId },
      counter,
    });
    return { states, outbox, subscriber };
  }

  it('інкрементує лічильник і видає безкоштовний візит на порозі', async () => {
    const { states, outbox, subscriber } = setup(3);

    await subscriber.handleOne(completed('apt-1'));
    await subscriber.handleOne(completed('apt-2'));
    const last = await subscriber.handleOne(completed('apt-3'));

    expect(last.handled).toBe(true);
    const state = states.store.get('client-1');
    expect(state?.hasFreeVisit).toBe(true);
    expect(state?.counter).toBe(0);
    expect(outbox.events.map((e) => e.type)).toContain('loyalty.free_visit.granted');
  });

  it('повторна доставка тієї ж події не дублює інкремент (ADR 0009)', async () => {
    const { states, subscriber } = setup(7);

    await subscriber.handleOne(completed('apt-1'));
    await subscriber.handleOne(completed('apt-1'));

    expect(states.store.get('client-1')?.counter).toBe(1);
  });

  it('ігнорує чужий тип, порожній пейлоад і візит без профілю (walk-in)', async () => {
    const known = setup(7);
    expect(
      (
        await known.subscriber.handleOne({
          type: 'scheduling.appointment.booked',
          occurredAt: at('2026-11-10T12:00:00Z'),
          payload: { appointmentId: 'apt-1' },
        })
      ).handled
    ).toBe(false);
    expect(
      (
        await known.subscriber.handleOne({
          type: 'scheduling.appointment.completed',
          occurredAt: at('2026-11-10T12:00:00Z'),
          payload: {},
        })
      ).handled
    ).toBe(false);

    const anonymous = setup(7, null);
    expect((await anonymous.subscriber.handleOne(completed('apt-9'))).handled).toBe(false);
    expect(anonymous.states.store.size).toBe(0);
  });
});
