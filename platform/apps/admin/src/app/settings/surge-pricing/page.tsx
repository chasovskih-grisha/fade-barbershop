'use client';

// Налаштування → Ціноутворення surge (T-4811): множники за годиною, днем і
// рівнем барбера. Чинність — лише для нових записів: множник снепшотиться на
// візиті, тому вже прийняті записи не дорожчають заднім числом (ADR 0006).
import { useState } from 'react';
import { AlertBanner, Button } from '@fade/ui';
import PageHeader from '../../components/PageHeader';
import SettingsTabs from '../settings-tabs';
import { useAdminToasts } from '../../components/use-admin-toasts';
import SurgeRuleForm from './surge-rule-form';
import SurgeRuleList from './surge-rule-list';
import { useSurgeRules } from './use-surge-rules';
import type { SurgeRuleRow } from './surge-rule-draft';

export default function SurgePricingSettingsPage() {
  const { push, viewport } = useAdminToasts();
  const { rules, locations, loadError, saving, save } = useSurgeRules();
  const [editing, setEditing] = useState<SurgeRuleRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = async (payload: Parameters<typeof save>[0], id?: string): Promise<void> => {
    const failure = await save(payload, id);
    if (failure) {
      setError(failure);
      return;
    }
    setError(null);
    setEditing(null);
    push(id ? 'Правило оновлено' : 'Правило додано — застосується до нових записів');
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Ціноутворення surge"
        subtitle="Множники за годиною, днем тижня і рівнем барбера; чинність — для нових записів"
      />
      <SettingsTabs />

      <AlertBanner tone="info" title="Ціна візиту не переписується">
        Множник фіксується на записі при бронюванні. Зміна правил не змінює вже прийняті візити.
      </AlertBanner>

      {loadError ? (
        <AlertBanner
          tone="error"
          title="Помилка"
          action={{ label: 'Спробувати ще раз', onClick: () => location.reload() }}
        >
          Не вдалося завантажити правила.
        </AlertBanner>
      ) : (
        <>
          <SurgeRuleList rules={rules} locations={locations} onEdit={setEditing} />
          <section className="flex flex-col gap-3" aria-label="Редактор правила">
            <div className="flex items-center justify-between">
              <h2 className="text-body font-medium text-fg">
                {editing ? 'Змінити правило' : 'Нове правило'}
              </h2>
              {editing ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Скасувати
                </Button>
              ) : null}
            </div>
            <SurgeRuleForm
              key={editing?.id ?? 'new'}
              editing={editing}
              locations={locations}
              saving={saving}
              onSave={(payload, id) => void apply(payload, id)}
            />
            {error ? (
              <p role="alert" className="text-caption text-semantic-danger">
                {error}
              </p>
            ) : null}
          </section>
        </>
      )}
      {viewport}
    </div>
  );
}
