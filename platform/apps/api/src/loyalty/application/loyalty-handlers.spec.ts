/* eslint-disable max-lines -- cohesive module (131 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { ProcessAppointmentCompletedHandler } from './process-appointment-completed.use-case';
import { ApplyFreeVisitHandler } from './apply-free-visit.use-case';
import { AdjustLoyaltyCounterHandler } from './adjust-loyalty-counter.use-case';
import type { ClientLoyaltyStateRepository, OutboxPublisher, Clock } from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';

class InMemoryLoyaltyRepository implements ClientLoyaltyStateRepository {
  private states = new Map<string, ClientLoyaltyState>();

  async findByClientId(clientId: string): Promise<ClientLoyaltyState | null> {
    return this.states.get(clientId) ?? null;
  }

  async save(state: ClientLoyaltyState): Promise<void> {
    this.states.set(state.clientId, ClientLoyaltyState.reconstitute(state.propsData));
  }
}

class InMemoryOutbox implements OutboxPublisher {
  readonly events: DomainEvent[] = [];

  async append(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

class TestClock implements Clock {
  constructor(private nowTime: Date = new Date()) {}
  now(): Date {
    return this.nowTime;
  }
}

describe('Loyalty Domain & Use Cases (T-141 / ADR 0009)', () => {
  let states: InMemoryLoyaltyRepository;
  let outbox: InMemoryOutbox;
  let clock: TestClock;
  let processHandler: ProcessAppointmentCompletedHandler;
  let applyHandler: ApplyFreeVisitHandler;
  let adjustHandler: AdjustLoyaltyCounterHandler;

  beforeEach(() => {
    states = new InMemoryLoyaltyRepository();
    outbox = new InMemoryOutbox();
    clock = new TestClock(new Date('2026-11-10T12:00:00Z'));
    const ctx = { states, outbox, clock, threshold: 3 }; // using threshold=3 for faster testing
    processHandler = new ProcessAppointmentCompletedHandler(ctx);
    applyHandler = new ApplyFreeVisitHandler(ctx);
    adjustHandler = new AdjustLoyaltyCounterHandler(ctx);
  });

  it('increments counter on completed visit and grants free visit when threshold reached', async () => {
    const clientId = 'client-1';

    // 1st visit
    let res = await processHandler.handle({
      clientId,
      appointmentId: 'apt-1',
      occurredAt: clock.now(),
    });
    expect(res.counter).toBe(1);
    expect(res.hasFreeVisit).toBe(false);

    // 2nd visit
    res = await processHandler.handle({
      clientId,
      appointmentId: 'apt-2',
      occurredAt: clock.now(),
    });
    expect(res.counter).toBe(2);
    expect(res.hasFreeVisit).toBe(false);

    // 3rd visit reaches threshold
    res = await processHandler.handle({
      clientId,
      appointmentId: 'apt-3',
      occurredAt: clock.now(),
    });
    expect(res.counter).toBe(0);
    expect(res.hasFreeVisit).toBe(true);

    const grantedEvent = outbox.events.find((e) => e.type === 'loyalty.free_visit.granted');
    expect(grantedEvent).toBeDefined();
  });

  it('is idempotent for appointmentId redelivery', async () => {
    const clientId = 'client-2';

    await processHandler.handle({
      clientId,
      appointmentId: 'apt-10',
      occurredAt: clock.now(),
    });

    const outboxCountBefore = outbox.events.length;

    // Redelivery of same appointmentId
    const res = await processHandler.handle({
      clientId,
      appointmentId: 'apt-10',
      occurredAt: clock.now(),
    });

    expect(res.counter).toBe(1);
    expect(outbox.events.length).toBe(outboxCountBefore);
  });

  it('applies and consumes free visit correctly', async () => {
    const clientId = 'client-3';

    // Reach free visit (threshold 3)
    await processHandler.handle({ clientId, appointmentId: 'apt-1', occurredAt: clock.now() });
    await processHandler.handle({ clientId, appointmentId: 'apt-2', occurredAt: clock.now() });
    await processHandler.handle({ clientId, appointmentId: 'apt-3', occurredAt: clock.now() });

    // Now hasFreeVisit is true
    const state = await states.findByClientId(clientId);
    expect(state?.hasFreeVisit).toBe(true);

    // Apply free visit to apt-4
    const applyRes = await applyHandler.handle({
      clientId,
      appointmentId: 'apt-4',
      occurredAt: clock.now(),
    });
    expect(applyRes.applied).toBe(true);

    // Complete apt-4 as free visit
    const completeRes = await processHandler.handle({
      clientId,
      appointmentId: 'apt-4',
      wasFreeVisit: true,
      occurredAt: clock.now(),
    });

    expect(completeRes.counter).toBe(0);
    expect(completeRes.hasFreeVisit).toBe(false);

    const usedEvent = outbox.events.find((e) => e.type === 'loyalty.free_visit.used');
    expect(usedEvent).toBeDefined();
  });

  it('allows manual counter adjustment with audit reason and event', async () => {
    const clientId = 'client-4';

    const res = await adjustHandler.handle({
      clientId,
      newCount: 2,
      reason: 'Manual correction by admin',
      adjustedBy: 'admin-user-1',
      occurredAt: clock.now(),
    });

    expect(res.newCount).toBe(2);
    expect(res.oldCount).toBe(0);

    const adjustedEvent = outbox.events.find((e) => e.type === 'loyalty.counter.adjusted');
    expect(adjustedEvent).toBeDefined();
    expect(adjustedEvent?.payload).toMatchObject({
      clientId,
      oldCount: 0,
      newCount: 2,
      reason: 'Manual correction by admin',
      adjustedBy: 'admin-user-1',
    });
  });
});
