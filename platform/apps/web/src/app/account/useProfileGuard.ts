'use client';

import { useCallback } from 'react';
import { useUnsavedProfile } from './unsaved-changes';

/** Wires the profile fields to the aside guard (T-4733b). */
export function useProfileGuard(
  fields: { name: string; savedName: string; note: string; savedNote: string },
  saveName: () => Promise<boolean>,
  saveNote: () => Promise<boolean>
) {
  const save = useCallback(async () => (await saveName()) && saveNote(), [saveName, saveNote]);
  const dirty = fields.name.trim() !== fields.savedName || fields.note !== fields.savedNote;
  useUnsavedProfile(dirty, save);
}
