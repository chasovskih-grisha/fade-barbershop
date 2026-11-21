'use client';

import { Card, Button } from '@fade/ui';
import { NotificationToggleRow } from './NotificationToggleRow';
import {
  NOTIFICATION_TOGGLE_OPTIONS,
  type NotificationPreferences,
} from './notification-preferences-data';

export type { NotificationPreferences } from './notification-preferences-data';

export function AccountNotificationsCard({
  preferences,
  saving,
  canSave,
  saveStatus,
  onChange,
  onSave,
}: {
  preferences: NotificationPreferences;
  saving: boolean;
  canSave: boolean;
  saveStatus: 'idle' | 'success' | 'error';
  onChange: (key: keyof NotificationPreferences, value: boolean) => void;
  onSave: () => void;
}) {
  return (
    <Card className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-display">Сповіщення</h2>
        <p className="text-body-s text-fg-secondary">
          Керуйте каналами та типами сповіщень про ваші візити та записи.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {NOTIFICATION_TOGGLE_OPTIONS.map((option) => (
          <NotificationToggleRow
            key={option.key}
            option={option}
            preferences={preferences}
            saving={saving}
            onChange={onChange}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button size="md" onClick={onSave} disabled={!canSave || saving} className="w-fit">
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
