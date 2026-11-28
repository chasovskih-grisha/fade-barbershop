import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/api/notification-preferences';
import {
  NOTIFICATION_DEFAULTS,
  type NotificationPreferences,
} from '@/lib/notification-preferences';

export type SaveStatus = 'idle' | 'success' | 'error';

export interface NotificationSwitchesState {
  preferences: NotificationPreferences;
  loaded: boolean;
  saving: boolean;
  status: SaveStatus;
  toggle: (key: keyof NotificationPreferences, value: boolean) => void;
  save: () => Promise<void>;
}

/** Перемикачі сповіщень профілю (T-4722c): читання і запис тих самих значень, що на сайті. */
export function useNotificationSwitches(): NotificationSwitchesState {
  const [preferences, setPreferences] = useState<NotificationPreferences>(NOTIFICATION_DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const stored = useRef<NotificationPreferences>(NOTIFICATION_DEFAULTS);

  useEffect(() => {
    let active = true;
    loadNotificationPreferences()
      .then((saved) => {
        if (!active) return;
        stored.current = saved;
        setPreferences(saved);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setStatus('idle');
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const saved = await saveNotificationPreferences(preferences);
      stored.current = saved;
      setPreferences(saved);
      setStatus('success');
    } catch {
      setPreferences(stored.current);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  return { preferences, loaded, saving, status, toggle, save };
}
