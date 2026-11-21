'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { Button } from '@fade/ui';
import { AISection } from './components/AISection';
import { AccountProfileCard } from './AccountProfileCard';
import { AccountBirthdayCard } from './AccountBirthdayCard';
import { AccountPreferencesCard, AccountReferralsLink } from './AccountPreferencesCard';
import { AccountNotificationsCard, NotificationPreferences } from './AccountNotificationsCard';
import { NextVisitSection } from './NextVisitSection';
import { useAccountName } from './useAccountName';
import { usePhoneChange } from './usePhoneChange';
import { useVisitSummary } from './useVisitSummary';
import { PhoneChangeDialog } from './PhoneChangeDialog';
import { isWithinPreferenceLimit, splitPreferenceLines } from './preferences';

export default function AccountPage() {
  const { user, logout, token, refreshUser } = useAuth();
  const accountName = useAccountName(user, token, refreshUser);
  const phoneChange = usePhoneChange(logout);
  const visits = useVisitSummary();
  const [preferences, setPreferences] = useState(user?.preferences.join('\n') || '');
  // Цитата в картці — остання *збережена* нотатка. Після успішного PATCH її
  // треба оновити локально: refreshUser асинхронний, а без цього текст
  // textarea зрівнюється зі старим user.preferences і повторне збереження
  // блокується (T-4731b).
  const [savedPreferences, setSavedPreferences] = useState<string[]>(user?.preferences ?? []);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    smsReminders: true,
    emailUpdates: true,
    pushNotifications: false,
    marketingOffers: false,
  });
  const [savedNotifPrefs, setSavedNotifPrefs] = useState<NotificationPreferences>({
    smsReminders: true,
    emailUpdates: true,
    pushNotifications: false,
    marketingOffers: false,
  });

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSaveStatus, setPrefSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [savingNotif, setSavingNotif] = useState(false);
  const [notifSaveStatus, setNotifSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSavePreferences = useCallback(async () => {
    const prefs = splitPreferenceLines(preferences);
    if (!isWithinPreferenceLimit(prefs)) return;
    if (!token || preferences === savedPreferences.join('\n')) return;
    setSavingPrefs(true);
    setPrefSaveStatus('idle');
    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSavedPreferences(prefs);
      setPrefSaveStatus('success');
      setTimeout(() => setPrefSaveStatus('idle'), 2000);
    } catch {
      setPrefSaveStatus('error');
    } finally {
      setSavingPrefs(false);
    }
  }, [token, preferences, savedPreferences]);

  const handleNotifChange = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveNotifPrefs = useCallback(async () => {
    setSavingNotif(true);
    setNotifSaveStatus('idle');
    try {
      await new Promise((r) => setTimeout(r, 400));
      setSavedNotifPrefs(notifPrefs);
      setNotifSaveStatus('success');
      setTimeout(() => setNotifSaveStatus('idle'), 2000);
    } catch {
      setNotifSaveStatus('error');
    } finally {
      setSavingNotif(false);
    }
  }, [notifPrefs]);

  if (!user) return null;

  const notifChanged = JSON.stringify(notifPrefs) !== JSON.stringify(savedNotifPrefs);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-h3">Профіль</h1>
        <Button variant="ghost" size="md" onClick={logout}>
          Вийти
        </Button>
      </header>
      <NextVisitSection summary={visits} />
      <AccountProfileCard
        name={accountName.name}
        phone={user.phone}
        visitCount={visits.state === 'ready' ? visits.pastCount : null}
        saving={accountName.saving}
        canSave={!accountName.saving && accountName.name.trim() !== (user?.name ?? '')}
        error={accountName.error}
        saved={accountName.saved}
        onNameChange={accountName.setName}
        onSave={accountName.save}
        onChangePhone={phoneChange.open}
      />
      <AccountBirthdayCard initial={user.birthday ?? null} token={token} onSaved={refreshUser} />
      <AccountPreferencesCard
        preferences={preferences}
        savedPreferences={savedPreferences}
        saving={savingPrefs}
        saveStatus={prefSaveStatus}
        onChange={setPreferences}
        onSave={handleSavePreferences}
      />
      <AccountNotificationsCard
        preferences={notifPrefs}
        saving={savingNotif}
        canSave={!savingNotif && notifChanged}
        saveStatus={notifSaveStatus}
        onChange={handleNotifChange}
        onSave={handleSaveNotifPrefs}
      />
      <AISection />
      <AccountReferralsLink />
      <PhoneChangeDialog flow={phoneChange} />
    </div>
  );
}
