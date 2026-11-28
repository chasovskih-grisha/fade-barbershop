import { memoryStorage } from '../../lib/cache-storage';
import { createClientMessageId, enqueueMessage, flushQueue, loadQueue } from '../offline-queue';
import type { ChatTransport } from '../offline-queue';

const storage = () => memoryStorage();

function transportThatFailsFirst(): ChatTransport & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async send(_visitId, _body, clientMessageId) {
      calls.push(clientMessageId);
      if (calls.length === 1) throw new Error('offline');
      return { duplicate: false };
    },
  };
}

describe('Офлайн-черга чату (T-081a)', () => {
  it('зберігає повідомлення до відправки з ключем, що не змінюється', async () => {
    const store = storage();
    const entry = await enqueueMessage(store, 'visit-1', '  Добрий день  ');

    expect(entry.body).toBe('Добрий день');
    expect(await loadQueue(store, 'visit-1')).toEqual([entry]);
    await flushQueue(store, 'visit-1', { send: async () => ({ duplicate: false }) });
    expect(await loadQueue(store, 'visit-1')).toEqual([]);
  });

  it('мережева помилка лишає повідомлення в черзі з тим самим clientMessageId', async () => {
    const store = storage();
    const first = await enqueueMessage(store, 'visit-1', 'перше');
    const second = await enqueueMessage(store, 'visit-1', 'друге');
    const transport = transportThatFailsFirst();

    const failed = await flushQueue(store, 'visit-1', transport);
    expect(failed.failed).toBe(true);
    expect(failed.sent).toHaveLength(0);
    expect(await loadQueue(store, 'visit-1')).toEqual([first, second]);

    const retried = await flushQueue(store, 'visit-1', transport);
    expect(retried.failed).toBe(false);
    expect(retried.sent.map((entry) => entry.clientMessageId)).toEqual([
      first.clientMessageId,
      second.clientMessageId,
    ]);
    expect(await loadQueue(store, 'visit-1')).toEqual([]);
  });

  it('дубль на сервері не лишає повідомлення в черзі', async () => {
    const store = storage();
    await enqueueMessage(store, 'visit-1', 'вже було');

    const result = await flushQueue(store, 'visit-1', { send: async () => ({ duplicate: true }) });

    expect(result.sent).toHaveLength(1);
    expect(await loadQueue(store, 'visit-1')).toEqual([]);
  });

  it('порожнє повідомлення не потрапляє в чергу, ключі різні', async () => {
    const store = storage();
    await expect(enqueueMessage(store, 'visit-1', '   ')).rejects.toThrow('empty message');
    expect(await loadQueue(store, 'visit-1')).toEqual([]);
    expect(createClientMessageId(1, () => 0.5)).not.toBe(createClientMessageId(2, () => 0.5));
  });
});
