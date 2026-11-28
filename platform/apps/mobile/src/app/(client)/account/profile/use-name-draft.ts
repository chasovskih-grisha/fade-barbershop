import { useEffect, useRef, useState } from 'react';
import { updateProfileName } from '@/lib/api/identity';
import {
  NAME_REQUIRED,
  NAME_SAVE_FAILED,
  SAVE_CONFIRMED_MS,
} from './save-sentences';

/** Name draft and the last stored name of the app profile (T-4726c). */
export function useNameDraft(initialName: string) {
  const [name, setName] = useState(initialName);
  const [storedName, setStoredName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Підтвердження знімається саме собою, але не після виходу з екрана:
  // інакше таймер лишається живим (і пише в розмонтований компонент).
  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    []
  );

  useEffect(() => {
    setName(initialName);
    setStoredName(initialName);
  }, [initialName]);

  const save = async (): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(NAME_REQUIRED);
      return false;
    }
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfileName(trimmed);
      const stored = updated.name ?? trimmed;
      setName(stored);
      setStoredName(stored);
      setSaved(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setSaved(false), SAVE_CONFIRMED_MS);
      return true;
    } catch {
      setError(NAME_SAVE_FAILED);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { name, setName, storedName, saving, error, saved, save };
}
