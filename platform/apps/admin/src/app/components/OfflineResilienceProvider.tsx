'use client';

import { OfflineContext } from './offline-context';
import { useOfflineOutbox } from './use-offline-outbox';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const outbox = useOfflineOutbox();
  return <OfflineContext.Provider value={outbox}>{children}</OfflineContext.Provider>;
}

export { useOffline } from './offline-context';
export { default as OfflineStatusBar } from './OfflineStatusBar';
