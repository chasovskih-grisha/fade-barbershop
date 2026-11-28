import { useSyncExternalStore } from 'react';
import type { MobileSession } from './use-biometric-login';

// Сесія застосунку поза екраном входу: профіль гасить її (T-4723c), а
// навігація застосунку показує «Вхід» замість «Кабінет».
let current: MobileSession | null = null;
let signInRequested = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readSession(): MobileSession | null {
  return current;
}

export function writeSession(next: MobileSession | null): void {
  current = next;
  signInRequested = next === null;
  for (const listener of listeners) listener();
}

/** true — сесію закрито виходом, тож застосунок показує форму входу. */
export function readSignInRequested(): boolean {
  return signInRequested;
}

export function useSignInRequested(): boolean {
  return useSyncExternalStore(subscribe, readSignInRequested, readSignInRequested);
}

export function useSession(): MobileSession | null {
  return useSyncExternalStore(subscribe, readSession, readSession);
}
