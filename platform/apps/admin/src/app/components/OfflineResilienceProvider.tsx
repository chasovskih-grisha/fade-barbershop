'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Button, Icon } from '@fade/ui';

interface OutboxMutation {
  id: string;
  url: string;
  method: string;
  body: unknown;
  idempotencyKey: string;
  timestamp: number;
  retries: number;
}

interface OfflineContextType {
  isOnline: boolean;
  outboxQueue: OutboxMutation[];
  syncStatus: 'idle' | 'syncing' | 'error';
  enqueueMutation: (url: string, method: string, body: unknown) => Promise<string>;
  triggerSync: () => Promise<void>;
  clearOutbox: () => void;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  outboxQueue: [],
  syncStatus: 'idle',
  enqueueMutation: async () => '',
  triggerSync: async () => {},
  clearOutbox: () => {},
});

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [outboxQueue, setOutboxQueue] = useState<OutboxMutation[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Load outbox from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fade_admin_outbox');
      if (saved) {
        setOutboxQueue(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save outbox to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('fade_admin_outbox', JSON.stringify(outboxQueue));
    } catch {
      // ignore
    }
  }, [outboxQueue]);

  const triggerSync = useCallback(async () => {
    if (outboxQueue.length === 0 || syncStatus === 'syncing') return;
    setSyncStatus('syncing');

    const remaining: OutboxMutation[] = [];
    for (const mutation of outboxQueue) {
      try {
        const res = await fetch(mutation.url, {
          method: mutation.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': mutation.idempotencyKey,
            'X-Vector-Timestamp': String(mutation.timestamp),
          },
          body: JSON.stringify(mutation.body),
          credentials: 'include',
        });

        if (!res.ok && res.status >= 500) {
          // Server error, keep in outbox for retry if retries < 3
          if (mutation.retries < 3) {
            remaining.push({ ...mutation, retries: mutation.retries + 1 });
          } else {
            console.error('Mutation reached max retries in outbox:', mutation);
          }
        }
      } catch {
        remaining.push(mutation);
      }
    }

    setOutboxQueue(remaining);
    setSyncStatus(remaining.length === 0 ? 'idle' : 'error');
  }, [outboxQueue, syncStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  const enqueueMutation = useCallback(async (url: string, method: string, body: unknown): Promise<string> => {
    const idempotencyKey = 'fade-idemp-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const mutation: OutboxMutation = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      method,
      body,
      idempotencyKey,
      timestamp: Date.now(),
      retries: 0,
    };

    if (navigator.onLine) {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
            'X-Vector-Timestamp': String(mutation.timestamp),
          },
          body: JSON.stringify(body),
          credentials: 'include',
        });
        if (res.ok) {
          return idempotencyKey;
        }
      } catch {
        // Fall through to offline queueing
      }
    }

    setOutboxQueue((prev) => [...prev, mutation]);
    return idempotencyKey;
  }, []);

  const clearOutbox = useCallback(() => {
    setOutboxQueue([]);
    localStorage.removeItem('fade_admin_outbox');
    setSyncStatus('idle');
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        outboxQueue,
        syncStatus,
        enqueueMutation,
        triggerSync,
        clearOutbox,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineStatusBar() {
  const { isOnline, outboxQueue, syncStatus, triggerSync } = useOffline();

  if (isOnline && outboxQueue.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Статус підключення та синхронізації"
      className={`flex items-center justify-between px-4 py-2 text-sm font-medium ${
        !isOnline ? 'bg-semantic-warning text-slate-950' : 'bg-blue-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon name={!isOnline ? 'alert' : 'info'} size={16} />
        <span>
          {!isOnline
            ? `Режим офлайн. Черга синхронізації: ${outboxQueue.length} змін.`
            : syncStatus === 'syncing'
            ? 'Синхронізація змін із сервером...'
            : `Онлайн. Очікують синхронізації: ${outboxQueue.length} змін.`}
        </span>
      </div>
      {outboxQueue.length > 0 && isOnline ? (
        <Button
          variant="secondary"
          onClick={() => triggerSync()}
          className="text-xs bg-white text-fg hover:bg-interactive-hover px-2.5 py-1 h-auto"
        >
          Синхронізувати зараз
        </Button>
      ) : null}
    </div>
  );
}
