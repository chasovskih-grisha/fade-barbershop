'use client';

import { useCallback, useState } from 'react';
import { useUnsavedGuard } from './unsaved-changes';

/** Aside navigation that asks about unsaved profile edits first (T-4733b). */
export function useCabinetNav(push: (href: string) => void) {
  const guard = useUnsavedGuard();
  const [pending, setPending] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const follow = useCallback(
    (event: React.MouseEvent, href: string) => {
      event.preventDefault();
      if (!guard.current?.isDirty()) {
        push(href);
        return;
      }
      setPending(href);
    },
    [guard, push]
  );

  const discard = useCallback(() => {
    const href = pending;
    setPending(null);
    if (href) push(href);
  }, [pending, push]);

  const saveThenGo = useCallback(async () => {
    setSaving(true);
    const saved = await guard.current?.save();
    setSaving(false);
    if (!saved) {
      setPending(null);
      return;
    }
    discard();
  }, [guard, discard]);

  const stay = useCallback(() => setPending(null), []);

  return { pending, saving, follow, discard, saveThenGo, stay };
}
