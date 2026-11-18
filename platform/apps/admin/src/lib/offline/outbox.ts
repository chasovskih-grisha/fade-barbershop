/**
 * T-4621: Offline Resilience & Local Queue Sync
 * OutboxQueue & IndexedDB storage manager for robust offline operations.
 */

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: unknown;
  idempotencyKey: string;
  createdAt: number;
  retries: number;
}

class OfflineOutboxStorage {
  private queue: QueuedMutation[] = [];
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fade_offline_outbox');
        if (stored) {
          this.queue = JSON.parse(stored);
        }
      } catch {
        this.queue = [];
      }
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fade_offline_outbox', JSON.stringify(this.queue));
      } catch (err) {
        console.error('Failed to persist offline outbox:', err);
      }
    }
  }

  public enqueue(mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'retries'>): QueuedMutation {
    const fullMutation: QueuedMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
      retries: 0,
    };
    this.queue.push(fullMutation);
    this.persist();
    return fullMutation;
  }

  public getQueue(): QueuedMutation[] {
    return [...this.queue];
  }

  public remove(id: string) {
    this.queue = this.queue.filter((m) => m.id !== id);
    this.persist();
  }

  public clear() {
    this.queue = [];
    this.persist();
  }

  public async sync(syncHandler: (mutation: QueuedMutation) => Promise<boolean>): Promise<number> {
    if (this.isSyncing || this.queue.length === 0) return 0;
    this.isSyncing = true;
    let syncedCount = 0;

    try {
      const itemsToSync = [...this.queue];
      for (const item of itemsToSync) {
        try {
          const success = await syncHandler(item);
          if (success) {
            this.remove(item.id);
            syncedCount++;
          } else {
            item.retries++;
            this.persist();
          }
        } catch (err) {
          console.error(`Error syncing mutation ${item.id}:`, err);
          item.retries++;
          this.persist();
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return syncedCount;
  }
}

export const offlineOutbox = new OfflineOutboxStorage();
