'use client';

import { useCallback, useState } from 'react';
import { isWithinPreferenceLimit, splitPreferenceLines } from './preferences';

type SaveStatus = 'idle' | 'success' | 'error';

export function useAccountPreferences(initialPreferences: string[], token: string | null) {
  const [preferences, setPreferences] = useState(initialPreferences.join('\n'));
  // Цитата в картці — остання *збережена* нотатка. Після успішного PATCH її
  // треба оновити локально: refreshUser асинхронний, а без цього текст
  // textarea зрівнюється зі старим user.preferences і повторне збереження
  // блокується (T-4731b).
  const [savedPreferences, setSavedPreferences] = useState<string[]>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const save = useCallback(async (): Promise<boolean> => {
    const prefs = splitPreferenceLines(preferences);
    if (!isWithinPreferenceLimit(prefs)) return false;
    if (!token || preferences === savedPreferences.join('\n')) return true;
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSavedPreferences(prefs);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
      return true;
    } catch {
      setStatus('error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [token, preferences, savedPreferences]);

  return { preferences, savedPreferences, setPreferences, saving, status, save };
}
