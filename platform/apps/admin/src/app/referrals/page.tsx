'use client';

import { useState } from 'react';
import { AlertBanner } from '@fade/ui';
import PageHeader from '../components/PageHeader';
import ReferralListCard from './ReferralListCard';
import ReferralSettingsCard from './ReferralSettingsCard';
import RevokeDialog from './RevokeDialog';
import { INITIAL_REFERRALS } from './referral-fixtures';
import {
  DEFAULT_SETTINGS,
  filterReferrals,
  type ReferralFilter,
  type ReferralItem,
  type ReferralProgramSettings,
} from './referral-model';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>(INITIAL_REFERRALS);
  const [filter, setFilter] = useState<ReferralFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ReferralItem | null>(null);
  const [reason, setReason] = useState('');
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReferralProgramSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const visible = filterReferrals(referrals, filter, query);

  const confirmRevoke = (): void => {
    if (!reason.trim()) {
      setRevokeError('Вкажіть обов`язкову причину анулювання (вимоги RFR-005).');
      return;
    }
    if (!selected) return;
    setReferrals((current) =>
      current.map((item) => (item.id === selected.id ? { ...item, rewardStatus: 'revoked' } : item))
    );
    setSuccess(`Реферал ${selected.friendName} успішно анульовано. Причина: ${reason}`);
    setSelected(null);
    setReason('');
    setRevokeError(null);
  };

  const saveSettings = (): void => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Реферальна програма та анти-аб'юз"
        subtitle="RFR-ADM-01…03: Налаштування програми, список рефералів та анти-аб'юз огляд"
      />
      {success ? <AlertBanner tone="success" title="Успішно" description={success} /> : null}
      <ReferralSettingsCard
        settings={settings}
        saved={saved}
        onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
        onSave={saveSettings}
      />
      <ReferralListCard
        items={visible}
        filter={filter}
        query={query}
        onFilter={setFilter}
        onQuery={setQuery}
        onRevoke={(item) => {
          setSelected(item);
          setReason('');
          setRevokeError(null);
        }}
      />
      {selected ? (
        <RevokeDialog
          referral={selected}
          reason={reason}
          error={revokeError}
          onReason={setReason}
          onCancel={() => setSelected(null)}
          onConfirm={confirmRevoke}
        />
      ) : null}
    </div>
  );
}
