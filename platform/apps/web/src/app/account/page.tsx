'use client';

import { Button } from '@fade/ui';
import { useAuth } from '../components/auth/AuthProvider';
import { AISection } from './components/AISection';
import { AccountProfileCard } from './AccountProfileCard';
import { AccountBirthdayCard } from './AccountBirthdayCard';
import { AccountPreferencesCard, AccountReferralsLink } from './AccountPreferencesCard';
import { AccountNotificationsCard } from './AccountNotificationsCard';
import { NextVisitSection } from './NextVisitSection';
import { useAccountName } from './useAccountName';
import { usePhoneChange } from './usePhoneChange';
import { useVisitSummary } from './useVisitSummary';
import { useAccountPreferences } from './useAccountPreferences';
import { useNotificationPreferences } from './useNotificationPreferences';
import { PhoneChangeDialog } from './PhoneChangeDialog';

export default function AccountPage() {
  const { user, logout, token, refreshUser } = useAuth();
  const accountName = useAccountName(user, token, refreshUser);
  const phoneChange = usePhoneChange(logout);
  const visits = useVisitSummary();
  const preferences = useAccountPreferences(user?.preferences ?? [], token);
  const notifications = useNotificationPreferences();

  if (!user) return null;

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
        preferences={preferences.preferences}
        savedPreferences={preferences.savedPreferences}
        saving={preferences.saving}
        saveStatus={preferences.status}
        onChange={preferences.setPreferences}
        onSave={preferences.save}
      />
      <AccountNotificationsCard
        preferences={notifications.preferences}
        saving={notifications.saving}
        canSave={!notifications.saving && notifications.changed}
        saveStatus={notifications.status}
        onChange={notifications.onChange}
        onSave={notifications.save}
      />
      <AISection />
      <AccountReferralsLink />
      <PhoneChangeDialog flow={phoneChange} />
    </div>
  );
}
