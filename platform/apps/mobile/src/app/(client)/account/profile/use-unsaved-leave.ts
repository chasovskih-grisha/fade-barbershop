import { useState } from 'react';
import { router } from 'expo-router';

export type UnsavedGuard = {
  open: boolean;
  saving: boolean;
  leave: (href: string) => void;
  save: () => Promise<void>;
  discard: () => void;
  stay: () => void;
};

/** Вихід із профілю з незбереженими змінами (T-4733c). */
export function useUnsavedLeave(dirty: boolean, saveAll: () => Promise<boolean>): UnsavedGuard {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function go() {
    if (pendingHref !== null) router.push(pendingHref);
    setPendingHref(null);
  }

  function leave(href: string) {
    if (!dirty) {
      router.push(href);
      return;
    }
    setPendingHref(href);
  }

  async function save() {
    setSaving(true);
    const saved = await saveAll();
    setSaving(false);
    if (saved) go();
  }

  return {
    open: pendingHref !== null,
    saving,
    leave,
    save,
    discard: go,
    stay: () => setPendingHref(null),
  };
}
