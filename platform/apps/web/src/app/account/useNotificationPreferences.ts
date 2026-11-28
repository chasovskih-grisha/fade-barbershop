'use client';

import { useCallback, useEffect, useState } from 'react';
import { NOTIFICATION_DEFAULTS, type NotificationPreferences } from './notification-preferences';

export type NotificationSaveStatus = 'idle' | 'success' | 'error';

export function useNotificationPreferences(token: string | null) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(NOTIFICATION_DEFAULTS);
  const [saved, setSaved] = useState<NotificationPreferences>(NOTIFICATION_DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<NotificationSaveStatus>('idle');

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    fetch('/api/account/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('load failed'))))
      .then((data: NotificationPreferences) => {
        if (cancelled) return;
        setPreferences(data);
        setSaved(data);
        setLoaded(true);
      })
      .catch(() => {
        // Unloaded switches stay disabled instead of flashing defaults.
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const change = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/account/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(preferences),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as NotificationPreferences;
      setPreferences(data);
      setSaved(data);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setPreferences(saved);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }, [token, preferences, saved]);

  return {
    preferences,
    loaded,
    saving,
    status,
    changed: JSON.stringify(preferences) !== JSON.stringify(saved),
    change,
    save,
  };
}
