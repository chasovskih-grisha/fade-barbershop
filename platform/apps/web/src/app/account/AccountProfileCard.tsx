'use client';

import { Card, Field, Button } from '@fade/ui';
import { ThisDeviceRow } from './ThisDeviceRow';
import type { ThisDevice } from './useThisDevice';

export function AccountProfileCard({
  name,
  phone,
  visitCount,
  device,
  saving,
  canSave,
  error,
  saved,
  onNameChange,
  onSave,
  onChangePhone,
}: {
  name: string;
  phone: string;
  /** Минулі візити з того самого списку, що вантажить кабінет; null — запит упав (T-4734b). */
  visitCount: number | null;
  /** Канал поточної сесії та кількість інших пристроїв (T-4724b). */
  device: ThisDevice;
  saving: boolean;
  canSave: boolean;
  error?: string | null;
  saved?: boolean;
  onNameChange: (value: string) => void;
  onSave: () => void;
  onChangePhone: () => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="font-display text-display">Акаунт</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Ім’я">
          <input
            id="name"
            className="h-11 rounded-input border border-line bg-surface-base px-3 font-text text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={saving}
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p role="alert" className="mt-1 text-body-s text-danger">
              {error}
            </p>
          )}
          {saved && <p className="mt-1 text-body-s text-success">Збережено</p>}
          {visitCount !== null && (
            <p className="mt-1 text-body-s text-fg-secondary">Візитів: {visitCount}</p>
          )}
        </Field>
        <Field id="phone" label="Номер телефону">
          <input
            id="phone"
            className="h-11 rounded-input border border-line bg-surface-base px-3 font-text text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            value={phone}
            readOnly
          />
          <div className="mt-2">
            <Button size="md" variant="secondary" onClick={onChangePhone} className="w-fit">
              Змінити номер
            </Button>
          </div>
        </Field>
      </div>
      <ThisDeviceRow device={device} />
      <div className="flex gap-2 pt-2">
        <Button size="md" onClick={onSave} disabled={!canSave} className="w-fit">
          Зберегти ім&apos;я
        </Button>
      </div>
    </Card>
  );
}
