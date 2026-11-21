'use client';

import { useCallback, useState } from 'react';

export interface NotificationPreferences {
  smsReminders: boolean;
  emailUpdates: boolean;
  pushNotifications: boolean;
  marketingOffers: boolean;
}

type SaveStatus = 'idle' | 'success' | 'error';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  smsReminders: true,
  emailUpdates: true,
  pushNotifications: false,
  marketingOffers: false,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [savedPreferences, setSavedPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const onChange = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setStatus('idle');
    try {
      await new Promise((r) => setTimeout(r, 400));
      setSavedPreferences(preferences);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  const changed = JSON.stringify(preferences) !== JSON.stringify(savedPreferences);

  return { preferences, saving, changed, status, onChange, save };
}
