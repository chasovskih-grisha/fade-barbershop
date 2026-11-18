'use client';

// Налаштування → Політика депозиту (PAY-ADM-09): відсоток, округлення і вікно
// скасування зберігаються в AppSetting. Снепшот на візиті не переписується,
// тому банер каже, що зміна стосується лише нових записів.
import { useState } from 'react';
import { AlertBanner, Skeleton } from '@fade/ui';
import PageHeader from '../../components/PageHeader';
import SettingsTabs from '../settings-tabs';
import { useAdminToasts } from '../../components/use-admin-toasts';
import DepositPolicyForm from './deposit-policy-form';
import DepositPolicyHistory from './deposit-policy-history';
import { useDepositPolicy } from './use-deposit-policy';
import type { DepositPolicy } from './deposit-policy-fields';

export default function DepositPolicySettingsPage() {
  const { push, viewport } = useAdminToasts();
  const { settings, history, loadError, saving, save } = useDepositPolicy();
  const [error, setError] = useState<string | null>(null);

  // Помилка лишається inline (role=alert); успіх — тост, що зникає.
  const apply = async (policy: DepositPolicy): Promise<void> => {
    const failure = await save(policy);
    if (failure) setError(failure);
    else push('Політику збережено — застосується лише до нових записів');
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Політика депозиту"
        subtitle={
          settings
            ? `Версія ${settings.version} · відсоток, округлення і вікно скасування; чинність — для нових записів`
            : 'Відсоток, округлення і вікно скасування; чинність — для нових записів'
        }
      />
      <SettingsTabs />

      <AlertBanner tone="info" title="Застосується лише до нових записів">
        Відсоток і вікно снепшотяться на візиті при записі: уже створені записи оцінюються за
        умовами, з якими їх прийняли.
      </AlertBanner>

      {loadError ? (
        <AlertBanner
          tone="error"
          title="Помилка"
          action={{ label: 'Спробувати ще раз', onClick: () => location.reload() }}
        >
          Не вдалося завантажити налаштування.
        </AlertBanner>
      ) : settings ? (
        <DepositPolicyForm
          policy={settings}
          saving={saving}
          onSave={(policy) => void apply(policy)}
        />
      ) : (
        <Skeleton variant="rect" className="h-64" />
      )}

      <DepositPolicyHistory rows={history} />

      {error ? (
        <AlertBanner tone="error" title="Помилка">
          {error}
        </AlertBanner>
      ) : null}
      {viewport}
    </div>
  );
}
