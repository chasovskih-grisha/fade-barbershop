'use client';

import { createContext, useContext, useEffect, useRef } from 'react';

export interface UnsavedGuard {
  isDirty: () => boolean;
  save: () => Promise<boolean>;
}

const GuardContext = createContext<{ current: UnsavedGuard | null }>({ current: null });

/** Holds the profile guard for the cabinet aside (T-4733b). */
export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const guard = useRef<UnsavedGuard | null>(null);
  return <GuardContext.Provider value={guard}>{children}</GuardContext.Provider>;
}

export function useUnsavedGuard() {
  return useContext(GuardContext);
}

/** Registers the dirty check and the section save the aside asks for. */
export function useUnsavedProfile(dirty: boolean, save: () => Promise<boolean>) {
  const guard = useUnsavedGuard();
  useEffect(() => {
    guard.current = { isDirty: () => dirty, save };
    return () => {
      guard.current = null;
    };
  }, [guard, dirty, save]);
}
