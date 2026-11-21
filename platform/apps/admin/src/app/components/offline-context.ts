import { createContext, useContext } from 'react';

export interface OutboxMutation {
  id: string;
  url: string;
  method: string;
  body: unknown;
  idempotencyKey: string;
  timestamp: number;
  retries: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface OfflineContextType {
  isOnline: boolean;
  outboxQueue: OutboxMutation[];
  syncStatus: SyncStatus;
  enqueueMutation: (url: string, method: string, body: unknown) => Promise<string>;
  triggerSync: () => Promise<void>;
  clearOutbox: () => void;
}

export const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  outboxQueue: [],
  syncStatus: 'idle',
  enqueueMutation: async () => '',
  triggerSync: async () => {},
  clearOutbox: () => {},
});

export function useOffline(): OfflineContextType {
  return useContext(OfflineContext);
}
