'use client';

import { Card, Toggle, Button } from '@fade/ui';
import type { NotificationPreferences } from './notification-preferences';

export function AccountNotificationsCard({
  preferences,
  saving,
  loaded,
  canSave,
  saveStatus,
  onChange,
  onSave,
}: {
  preferences: NotificationPreferences;
  saving: boolean;
  loaded: boolean;
  canSave: boolean;
  saveStatus: 'idle' | 'success' | 'error';
  onChange: (key: keyof NotificationPreferences, value: boolean) => void;
  onSave: () => void;
}) {
  const disabled = saving || !loaded;

  return (
    <Card className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-display">Сповіщення</h2>
        <p className="text-body-s text-fg-secondary">
          Керуйте каналами та типами сповіщень про ваші візити та записи.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between py-2 border-b border-line/40">
          <div className="flex flex-col gap-0.5">
            <span className="font-text text-body font-medium">SMS-нагадування</span>
            <span className="text-body-s text-fg-secondary">
              Отримувати нагадування про візит за 2 години
            </span>
          </div>
          <Toggle
            label="SMS-нагадування"
            checked={preferences.smsReminders}
            onChange={(e) => onChange('smsReminders', e.target.checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-line/40">
          <div className="flex flex-col gap-0.5">
            <span className="font-text text-body font-medium">Email-підтвердження</span>
            <span className="text-body-s text-fg-secondary">
              Деталі запису, чеки та зміна статусу візиту
            </span>
          </div>
          <Toggle
            label="Email-підтвердження"
            checked={preferences.emailUpdates}
            onChange={(e) => onChange('emailUpdates', e.target.checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-line/40">
          <div className="flex flex-col gap-0.5">
            <span className="font-text text-body font-medium">Push-сповіщення</span>
            <span className="text-body-s text-fg-secondary">
              Сповіщення в браузері про статус запису та майстра
            </span>
          </div>
          <Toggle
            label="Push-сповіщення"
            checked={preferences.pushNotifications}
            onChange={(e) => onChange('pushNotifications', e.target.checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-0.5">
            <span className="font-text text-body font-medium">Маркетингові пропозиції</span>
            <span className="text-body-s text-fg-secondary">
              Спеціальні знижки, подарункові акції та новинки
            </span>
          </div>
          <Toggle
            label="Маркетингові пропозиції"
            checked={preferences.marketingOffers}
            onChange={(e) => onChange('marketingOffers', e.target.checked)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="md" onClick={onSave} disabled={!canSave || disabled} className="w-fit">
          {saving ? 'Збереження...' : 'Зберегти налаштування'}
        </Button>
        {saveStatus === 'success' && <p className="text-body-s text-success">Збережено</p>}
        {saveStatus === 'error' && (
          <p className="text-body-s text-danger">Помилка збереження. Спробуйте ще раз.</p>
        )}
      </div>
    </Card>
  );
}
