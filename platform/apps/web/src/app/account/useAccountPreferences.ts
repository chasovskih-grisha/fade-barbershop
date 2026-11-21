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

  const save = useCallback(async () => {
    const prefs = splitPreferenceLines(preferences);
    if (!isWithinPreferenceLimit(prefs)) return;
    if (!token || preferences === savedPreferences.join('\n')) return;
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
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }, [token, preferences, savedPreferences]);

  return { preferences, savedPreferences, setPreferences, saving, status, save };
}
