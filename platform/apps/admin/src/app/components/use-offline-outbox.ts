'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OutboxMutation, SyncStatus } from './offline-context';
import {
  clearStoredOutbox,
  createMutation,
  loadStoredOutbox,
  saveStoredOutbox,
  sendMutation,
} from './offline-sync';

export function useOfflineOutbox() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [outboxQueue, setOutboxQueue] = useState<OutboxMutation[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    setOutboxQueue(loadStoredOutbox());
  }, []);

  useEffect(() => {
    saveStoredOutbox(outboxQueue);
  }, [outboxQueue]);

  const triggerSync = useCallback(async () => {
    if (outboxQueue.length === 0 || syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    const remaining: OutboxMutation[] = [];
    for (const mutation of outboxQueue) {
      const status = await sendMutation(mutation);
      if (status === null || (status >= 500 && mutation.retries < 3)) {
        remaining.push({ ...mutation, retries: mutation.retries + 1 });
      }
    }
    setOutboxQueue(remaining);
    setSyncStatus(remaining.length === 0 ? 'idle' : 'error');
  }, [outboxQueue, syncStatus]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      void triggerSync();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [triggerSync]);

  const enqueueMutation = useCallback(async (url: string, method: string, body: unknown) => {
    const mutation = createMutation(url, method, body);
    if (navigator.onLine && (await sendMutation(mutation)) === 200) {
      return mutation.idempotencyKey;
    }
    setOutboxQueue((previous) => [...previous, mutation]);
    return mutation.idempotencyKey;
  }, []);

  const clearOutbox = useCallback(() => {
    setOutboxQueue([]);
    clearStoredOutbox();
    setSyncStatus('idle');
  }, []);

  return { isOnline, outboxQueue, syncStatus, enqueueMutation, triggerSync, clearOutbox };
}
