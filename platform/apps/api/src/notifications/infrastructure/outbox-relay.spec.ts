// Прохід релея (T-4608, розширено T-080): вибірка лише своїх типів і лише
// дозрілих відкладених рядків (availableAt), маркер publishedAt лише коли всі
// споживачі довели справу. Маршрутизація типів — outbox-routing.spec.ts,
// життєвий цикл таймера — outbox-dispatcher.spec.ts. Хелпери — outbox-relay.fakes.ts.
import { POLL_TYPES } from './outbox-routing';
import { makeRelay, outboxMessage } from './outbox-relay.fakes';

describe('релей outbox notifications (T-080)', () => {
  it('вибирає лише свої типи, неопубліковані й дозрілі рядки', async () => {
    const { dispatcher, findMany } = makeRelay([{ handled: true, reason: 'sent' }], []);
    await dispatcher.pollOnce();

    const where = findMany.mock.calls[0]?.[0]?.where;
    expect(where?.type).toEqual({ in: [...POLL_TYPES] });
    expect(where?.publishedAt).toBeNull();
    // Відкладені рядки (нагадування) видно лише після availableAt.
    expect(where?.OR).toEqual([{ availableAt: null }, { availableAt: { lte: expect.any(Date) } }]);
  });

  it('усі споживачі handled/dup → маркер publishedAt, processed рахує доставки', async () => {
    const { dispatcher, update } = makeRelay(
      [
        { handled: true, reason: 'sent' },
        { handled: false, reason: 'duplicate' },
      ],
      [outboxMessage('evt-1'), outboxMessage('evt-2', 'notification.reminder.due')]
    );

    const { processed } = await dispatcher.pollOnce();

    // evt-1 → три споживачі (підтвердження + планувальник + push), evt-2 → один
    expect(processed).toBe(4);
    expect(update.mock.calls.map((c) => c[0].where.id)).toEqual(['evt-1', 'evt-2']);
  });

  it('ignored від одного споживача → маркера немає, рядок лишається pending', async () => {
    const { dispatcher, update } = makeRelay(
      [
        { handled: false, reason: 'ignored' },
        { handled: true, reason: 'sent' },
      ],
      [outboxMessage('evt-1')]
    );

    const { processed } = await dispatcher.pollOnce();

    expect(processed).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });

  it('падіння споживача перериває прохід: маркера немає, подія pending', async () => {
    const { dispatcher, update } = makeRelay(new Error('sms gateway down'));

    await expect(dispatcher.pollOnce()).rejects.toThrow('sms gateway down');
    expect(update).not.toHaveBeenCalled();
  });
});
