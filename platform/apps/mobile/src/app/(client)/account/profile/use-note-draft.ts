import { useEffect, useRef, useState } from 'react';
import { updateProfilePreferences } from '@/lib/api/identity';
import { NOTE_LIMIT_MESSAGE, linesToNote, noteFitsLimit, noteToLines } from './note';
import { NOTE_SAVE_FAILED, SAVE_CONFIRMED_MS } from './save-sentences';

export function useNoteDraft(storedPreferences: readonly string[]) {
  const storedNote = linesToNote(storedPreferences);
  const [note, setNote] = useState(storedNote);
  const [savedNote, setSavedNote] = useState(storedNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Той самий строк підтвердження, що в секції імені, з тим самим зняттям.
  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    []
  );

  async function save(): Promise<boolean> {
    if (!noteFitsLimit(note)) {
      setError(NOTE_LIMIT_MESSAGE);
      return false;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const lines = await updateProfilePreferences(noteToLines(note));
      setSavedNote(linesToNote(lines));
      setNote(linesToNote(lines));
      setSaved(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setSaved(false), SAVE_CONFIRMED_MS);
      return true;
    } catch {
      setError(NOTE_SAVE_FAILED);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    note,
    savedNote,
    storedNote,
    changed: note !== savedNote,
    saving,
    error,
    saved,
    setNote: (value: string) => {
      setNote(value);
      setSaved(false);
      setError(null);
    },
    save,
  };
}
