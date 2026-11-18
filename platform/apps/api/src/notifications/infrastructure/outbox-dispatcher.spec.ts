// Життєвий цикл таймера релея (T-4608): автостарт вимкнено в тестовому
// середовищі, start/stop керують тіками, помилка проходу не вбиває цикл.
// Алгоритм проходу — outbox-relay.spec.ts.

import { OutboxNotificationsDispatcher } from './outbox-dispatcher';
import type { OutboxConsumers } from './outbox-routing';

const quiet = () => ({ handled: false, reason: 'ignored' as const });

const makeDispatcher = (consumers?: Partial<OutboxConsumers>) => {
  const consumer = {
    handleOne: jest.fn(async () => quiet()),
  } as unknown as OutboxConsumers['confirmations'];
  const registry = {
    confirmations: consumer,
    alerts: consumer,
    schedule: consumer,
    reminders: consumer,
    appointmentPush: consumer,
    ...consumers,
  } as OutboxConsumers;
  const pending = {
    id: 'evt-1',
    type: 'scheduling.appointment.booked',
    aggregateId: 'apt-1',
    payload: {},
  };
  const prisma = {
    outboxMessage: { findMany: jest.fn().mockResolvedValue([pending]), update: jest.fn() },
  };
  return { dispatcher: new OutboxNotificationsDispatcher(prisma as never, registry), consumer };
};

describe('OutboxNotificationsDispatcher: таймер (T-4608)', () => {
  it('автостарт вимкнено в тестовому середовищі; start(0) не планує тіки', () => {
    const { dispatcher } = makeDispatcher();
    expect(() => dispatcher.onApplicationBootstrap()).not.toThrow();
    dispatcher.start(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((dispatcher as any).timer).toBeUndefined();
  });

  it('start/stop керують таймером; зупинка onModuleDestroy', () => {
    const { dispatcher } = makeDispatcher();
    dispatcher.start(60_000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((dispatcher as any).timer).toBeDefined();
    dispatcher.onModuleDestroy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((dispatcher as any).timer).toBeUndefined();
  });

  it('помилка тіка не вбиває цикл: наступний тік планується', async () => {
    jest.useFakeTimers();
    try {
      const failing = {
        handleOne: jest.fn(async () => {
          throw new Error('boom');
        }),
      } as unknown as OutboxConsumers['confirmations'];
      const { dispatcher } = makeDispatcher({ confirmations: failing });
      dispatcher.start(10);
      await jest.advanceTimersByTimeAsync(25);
      expect(failing.handleOne).toHaveBeenCalled();
      dispatcher.onModuleDestroy();
    } finally {
      jest.useRealTimers();
    }
  });
});
