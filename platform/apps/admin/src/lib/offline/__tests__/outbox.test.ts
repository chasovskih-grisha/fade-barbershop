/**
 * T-4621: Unit tests for offline outbox and resilience
 */
import { offlineOutbox } from '../outbox';

describe('OfflineOutbox', () => {
  beforeEach(() => {
    localStorage.clear();
    offlineOutbox.clear();
  });

  test('should enqueue mutations and persist them', () => {
    const mut = offlineOutbox.enqueue({
      endpoint: '/api/appointments/check-in',
      method: 'POST',
      payload: { appointmentId: 'app_123' },
      idempotencyKey: 'idem_key_1',
    });

    expect(mut.id).toBeDefined();
    expect(offlineOutbox.getQueue().length).toBe(1);
    expect(offlineOutbox.getQueue()[0]?.endpoint).toBe('/api/appointments/check-in');
  });

  test('should remove successfully synced mutations', async () => {
    offlineOutbox.enqueue({
      endpoint: '/api/appointments/check-in',
      method: 'POST',
      payload: { appointmentId: 'app_123' },
      idempotencyKey: 'idem_key_2',
    });

    expect(offlineOutbox.getQueue().length).toBe(1);

    const syncedCount = await offlineOutbox.sync(async () => true);
    expect(syncedCount).toBe(1);
    expect(offlineOutbox.getQueue().length).toBe(0);
  });
});
