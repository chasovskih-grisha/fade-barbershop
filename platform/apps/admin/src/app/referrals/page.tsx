'use client';

import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { Button, AlertBanner } from '@fade/ui';

interface ReferralItem {
  id: string;
  friendName: string;
  friendPhone: string;
  referrerName: string;
  referrerPhone: string;
  locationName: string;
  registrationDate: string;
  status: 'booked' | 'completed' | 'no_show' | 'cancelled';
  rewardStatus: 'pending' | 'awarded' | 'revoked';
  rewardAmount: string;
  suspiciousPattern?: 'shared_phone' | 'device_cluster' | 'series_no_show';
}

const INITIAL_REFERRALS: ReferralItem[] = [
  {
    id: 'ref-1',
    friendName: 'Artem Kravchenko',
    friendPhone: '+380671112233',
    referrerName: 'Alexander Wright',
    referrerPhone: '+380671112233',
    locationName: 'FADE Хрещатик',
    registrationDate: '2026-11-10',
    status: 'booked',
    rewardStatus: 'pending',
    rewardAmount: '200 UAH',
    suspiciousPattern: 'shared_phone',
  },
  {
    id: 'ref-2',
    friendName: 'Denys Melnyk',
    friendPhone: '+380502223344',
    referrerName: 'Max Taylor',
    referrerPhone: '+380509998877',
    locationName: 'FADE Подолян',
    registrationDate: '2026-11-09',
    status: 'completed',
    rewardStatus: 'awarded',
    rewardAmount: '150 UAH',
  },
  {
    id: 'ref-3',
    friendName: 'Serhii Boyko',
    friendPhone: '+380933334455',
    referrerName: 'Ihor Petrenko',
    referrerPhone: '+380931112233',
    locationName: 'FADE Хрещатик',
    registrationDate: '2026-11-08',
    status: 'no_show',
    rewardStatus: 'pending',
    rewardAmount: '200 UAH',
    suspiciousPattern: 'series_no_show',
  },
  {
    id: 'ref-4',
    friendName: 'Oleh Koval',
    friendPhone: '+380634445566',
    referrerName: 'Andriy Shevchenko',
    referrerPhone: '+380632223344',
    locationName: 'FADE Печерськ',
    registrationDate: '2026-11-07',
    status: 'completed',
    rewardStatus: 'awarded',
    rewardAmount: '200 UAH',
    suspiciousPattern: 'device_cluster',
  },
];

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>(INITIAL_REFERRALS);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Revoke dialog state with reason (RFR-005 log)
  const [selectedRef, setSelectedRef] = useState<ReferralItem | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Settings state (RFR-ADM-01)
  const [settings, setSettings] = useState({
    referralDiscountPct: 15,
    rewardAmount: '200 UAH',
    rewardExpiryDays: 90,
    attributionWindowDays: 30,
    enabled: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const filteredReferrals = referrals.filter((item) => {
    if (filterType === 'suspicious' && !item.suspiciousPattern) return false;
    if (filterType === 'pending' && item.rewardStatus !== 'pending') return false;
    if (filterType === 'awarded' && item.rewardStatus !== 'awarded') return false;
    if (filterType === 'revoked' && item.rewardStatus !== 'revoked') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.friendName.toLowerCase().includes(q) ||
        item.friendPhone.includes(q) ||
        item.referrerName.toLowerCase().includes(q) ||
        item.referrerPhone.includes(q)
      );
    }
    return true;
  });

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeReason.trim()) {
      setRevokeError('Вкажіть обов`язкову причину анулювання (вимоги RFR-005).');
      return;
    }
    if (!selectedRef) return;

    setReferrals((prev) =>
      prev.map((r) => (r.id === selectedRef.id ? { ...r, rewardStatus: 'revoked' } : r))
    );
    setSuccessMessage(`Реферал ${selectedRef.friendName} успішно анульовано. Причина: ${revokeReason}`);
    setSelectedRef(null);
    setRevokeReason('');
    setRevokeError(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Реферальна програма та анти-аб'юз"
        subtitle="RFR-ADM-01…03: Налаштування програми, список рефералів та анти-аб'юз огляд"
      />

      {successMessage && (
        <AlertBanner tone="success" title="Успішно" description={successMessage} />
      )}

      {/* RFR-ADM-01: Налаштування програми */}
      <div className="rounded-card bg-surface p-6 shadow-card">
        <h2 className="text-h2 font-semibold text-fg mb-4">Налаштування програми (RFR-ADM-01)</h2>
        {settingsSaved && (
          <div className="mb-4">
            <AlertBanner tone="success" title="Збережено" description="Параметри реферальної програми оновлено." />
          </div>
        )}
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-body-sm font-medium text-fg-secondary mb-1">
              Знижка рефералу (%)
            </label>
            <input
              type="number"
              value={settings.referralDiscountPct}
              onChange={(e) => setSettings({ ...settings, referralDiscountPct: Number(e.target.value) })}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-fg"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-fg-secondary mb-1">
              Винагорода запрошувачу
            </label>
            <input
              type="text"
              value={settings.rewardAmount}
              onChange={(e) => setSettings({ ...settings, rewardAmount: e.target.value })}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-fg"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-fg-secondary mb-1">
              Строк дії винагороди (днів)
            </label>
            <input
              type="number"
              value={settings.rewardExpiryDays}
              onChange={(e) => setSettings({ ...settings, rewardExpiryDays: Number(e.target.value) })}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-fg"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-fg-secondary mb-1">
              Вікно атрибуції (днів)
            </label>
            <input
              type="number"
              value={settings.attributionWindowDays}
              onChange={(e) => setSettings({ ...settings, attributionWindowDays: Number(e.target.value) })}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-fg"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="programEnabled"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-border text-accent-blue"
            />
            <label htmlFor="programEnabled" className="text-body font-medium text-fg">
              Програма увімкнена
            </label>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="primary">
              Зберегти налаштування
            </Button>
          </div>
        </form>
      </div>

      {/* RFR-ADM-02 & RFR-ADM-03: Список рефералів та анти-аб'юз огляд */}
      <div className="rounded-card bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-h2 font-semibold text-fg">Список рефералів та анти-аб'юз огляд (RFR-ADM-02/03)</h2>
            <p className="text-body-sm text-fg-secondary">
              Фільтрація підозрілих патернів (спільні телефони, пристрої, серії no-show) та ручне анулювання з логом.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-pill px-3 py-1.5 text-body-sm font-medium ${
                filterType === 'all' ? 'bg-interactive text-fg' : 'bg-surface-raised text-fg-secondary'
              }`}
            >
              Усі
            </button>
            <button
              onClick={() => setFilterType('suspicious')}
              className={`rounded-pill px-3 py-1.5 text-body-sm font-medium ${
                filterType === 'suspicious' ? 'bg-interactive text-fg' : 'bg-surface-raised text-fg-secondary'
              }`}
            >
              ⚠️ Підозрілі (Анти-аб'юз)
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`rounded-pill px-3 py-1.5 text-body-sm font-medium ${
                filterType === 'pending' ? 'bg-interactive text-fg' : 'bg-surface-raised text-fg-secondary'
              }`}
            >
              Очікують
            </button>
            <button
              onClick={() => setFilterType('awarded')}
              className={`rounded-pill px-3 py-1.5 text-body-sm font-medium ${
                filterType === 'awarded' ? 'bg-interactive text-fg' : 'bg-surface-raised text-fg-secondary'
              }`}
            >
              Нараховані
            </button>
            <button
              onClick={() => setFilterType('revoked')}
              className={`rounded-pill px-3 py-1.5 text-body-sm font-medium ${
                filterType === 'revoked' ? 'bg-interactive text-fg' : 'bg-surface-raised text-fg-secondary'
              }`}
            >
              Анульовані
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Пошук за ім'ям або телефоном..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md rounded-input border border-border bg-surface px-3 py-2 text-fg"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-fg-secondary text-body-sm">
                <th className="py-3 px-4">Друг (Реферал)</th>
                <th className="py-3 px-4">Хто привів</th>
                <th className="py-3 px-4">Локація</th>
                <th className="py-3 px-4">Дата реєстрації</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4">Винагорода</th>
                <th className="py-3 px-4">Анти-аб'юз</th>
                <th className="py-3 px-4 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-fg-secondary">
                    Рефералів за вибраними критеріями не знайдено.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-surface-raised/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-fg">{item.friendName}</div>
                      <div className="text-body-sm text-fg-secondary">{item.friendPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-fg">{item.referrerName}</div>
                      <div className="text-body-sm text-fg-secondary">{item.referrerPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-fg-secondary">{item.locationName}</td>
                    <td className="py-3 px-4 text-fg-secondary">{item.registrationDate}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block rounded-pill px-2.5 py-1 text-body-sm font-medium ${
                        item.status === 'completed'
                          ? 'bg-semantic-success/10 text-semantic-success'
                          : item.status === 'booked'
                          ? 'bg-blue-500/10 text-accent-blue'
                          : 'bg-rose-500/10 text-semantic-danger'
                      }`}>
                        {item.status === 'completed' ? 'Завершив візит' : item.status === 'booked' ? 'Записався' : item.status === 'no_show' ? 'No-show' : 'Скасовано'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-fg">{item.rewardAmount}</div>
                      <span className={`text-body-sm ${
                        item.rewardStatus === 'awarded'
                          ? 'text-semantic-success'
                          : item.rewardStatus === 'pending'
                          ? 'text-semantic-warning'
                          : 'text-semantic-danger'
                      }`}>
                        {item.rewardStatus === 'awarded' ? 'Нарахована' : item.rewardStatus === 'pending' ? 'Очікує' : 'Анульована'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.suspiciousPattern ? (
                        <span className="inline-block rounded-pill bg-semantic-warning/10 px-2.5 py-1 text-body-sm font-medium text-semantic-warning">
                          {item.suspiciousPattern === 'shared_phone' ? 'Спільний телефон' : item.suspiciousPattern === 'device_cluster' ? 'Кластер пристроїв' : 'Серія no-show'}
                        </span>
                      ) : (
                        <span className="text-fg-secondary text-body-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.rewardStatus !== 'revoked' && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedRef(item);
                            setRevokeReason('');
                            setRevokeError(null);
                          }}
                        >
                          Анулювати
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Dialog */}
      {selectedRef && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-dialog-title"
        >
          <div className="w-full max-w-md rounded-card bg-surface p-6 shadow-lg">
            <h3 id="revoke-dialog-title" className="text-h3 font-semibold text-fg mb-4">
              Анулювання рефералу та винагороди
            </h3>
            <form onSubmit={handleRevokeSubmit} className="flex flex-col gap-4">
              <p className="text-body text-fg-secondary">
                Ви збираєтесь анулювати реферал клієнта <strong className="text-fg">{selectedRef.friendName}</strong> (запросив {selectedRef.referrerName}). Це призведе до скасування бонусів та запису в системний аудит-лог (RFR-005).
              </p>
              {revokeError && (
                <AlertBanner tone="error" title="Помилка валідації" description={revokeError} />
              )}
              <div>
                <label className="block text-body-sm font-medium text-fg mb-1">
                  Причина анулювання (обов'язково):
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Введіть детальну причину підозри або аб'юзу..."
                  className="w-full rounded-input border border-border bg-surface p-3 text-fg h-24"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setSelectedRef(null)}>
                  Скасувати
                </Button>
                <Button type="submit" variant="primary">
                  Підтвердити анулювання
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
