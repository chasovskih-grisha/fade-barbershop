/**
 * T-4621: Offline status and manual sync banner component
 */
'use client';

import React, { useEffect, useState } from 'react';
import { offlineOutbox } from '../../lib/offline/outbox';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    setQueueCount(offlineOutbox.getQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setQueueCount(offlineOutbox.getQueue().length);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      await offlineOutbox.sync(async (mut) => {
        const res = await fetch(mut.endpoint, {
          method: mut.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': mut.idempotencyKey,
          },
          body: JSON.stringify(mut.payload),
        });
        return res.ok;
      });
      setQueueCount(offlineOutbox.getQueue().length);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && queueCount === 0) return null;

  return (
    <div style={{
      backgroundColor: 'var(--color-surface-raised)',
      color: 'var(--color-text-primary)',
      padding: '8px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '14px',
      borderBottom: `1px solid ${isOnline ? 'var(--color-semantic-success)' : 'var(--color-semantic-danger)'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: isOnline ? 'var(--color-semantic-success)' : 'var(--color-semantic-danger)', fontWeight: 'bold' }}>
          {isOnline ? '⚡' : '📡'}
        </span>
        <span>
          {!isOnline ? 'You are currently offline. Changes are saved locally.' : `Online. Syncing queued mutations (${queueCount} pending)...`}
        </span>
      </div>
      {queueCount > 0 && isOnline && (
        <button
          onClick={triggerSync}
          disabled={syncing}
          style={{
            background: 'var(--color-interactive-default)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-default)',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  );
}
