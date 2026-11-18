// T-4805: воркер анонімізує, видаляє фото й закриває заявку; збій лишає
// заявку з backoff, а після ліміту — failed для ручного розбору.
import { RunErasure } from './run-erasure';
import { FakeErasureStore, FakeObjects } from './erasure.fakes';
import { MAX_ERASURE_ATTEMPTS } from '../domain/erasure-policy';

const NOW = new Date('2026-11-17T10:00:00Z');

function build() {
  const store = new FakeErasureStore();
  const objects = new FakeObjects();
  const audit: Record<string, string | number>[] = [];
  const run = new RunErasure({ store, objects, audit: (event) => audit.push(event) });
  return { store, objects, audit, run };
}

async function pending(store: FakeErasureStore) {
  return store.request('user-1', 'hash', NOW);
}

describe('RunErasure (T-4805)', () => {
  it('анонімізує PII, видаляє фото і закриває заявку звітом', async () => {
    const { store, objects, audit, run } = build();
    await pending(store);

    await expect(run.execute(NOW)).resolves.toBe(1);

    expect(store.anonymized).toEqual(['user-1']);
    expect(objects.removed).toEqual([['photos/a.jpg', 'photos/b.jpg']]);
    expect(store.rows[0]?.status).toBe('completed');
    expect(store.rows[0]?.report).toMatchObject({ sessionsRevoked: 2, objectsDeleted: 2 });
    expect(audit).toEqual([
      expect.objectContaining({ status: 'completed', objectsDeleted: 2 }),
    ]);
  });

  it('не бере заявки, час яких ще не настав', async () => {
    const { store, run } = build();
    await pending(store);
    const row = store.rows[0];
    if (row) row.nextAttemptAt = new Date(NOW.getTime() + 60_000);

    await expect(run.execute(NOW)).resolves.toBe(0);
    expect(store.anonymized).toEqual([]);
  });

  it('збій анонімізації лишає заявку з backoff і не валить прогін', async () => {
    const { store, run } = build();
    await pending(store);
    store.anonymizeError = new Error('db down');

    await expect(run.execute(NOW)).resolves.toBe(0);

    expect(store.failures).toHaveLength(1);
    expect(store.failures[0]?.error).toBe('db down');
    expect(store.rows[0]?.status).toBe('pending');
  });

  it('після ліміту спроб заявка стає failed', async () => {
    const { store, run } = build();
    await pending(store);
    const row = store.rows[0];
    if (row) row.attempts = MAX_ERASURE_ATTEMPTS - 1;
    store.anonymizeError = new Error('db down');

    await run.execute(NOW);

    expect(store.rows[0]?.status).toBe('failed');
  });
});
