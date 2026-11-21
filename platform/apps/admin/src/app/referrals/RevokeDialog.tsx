'use client';

import { AlertBanner, Button } from '@fade/ui';
import type { ReferralItem } from './referral-model';

export default function RevokeDialog({
  referral,
  reason,
  error,
  onReason,
  onCancel,
  onConfirm,
}: {
  referral: ReferralItem;
  reason: string;
  error: string | null;
  onReason: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-body text-fg-secondary">
            Ви збираєтесь анулювати реферал клієнта{' '}
            <strong className="text-fg">{referral.friendName}</strong> (запросив{' '}
            {referral.referrerName}). Це призведе до скасування бонусів та запису в системний
            аудит-лог (RFR-005).
          </p>
          {error ? (
            <AlertBanner tone="error" title="Помилка валідації" description={error} />
          ) : null}
          <div>
            <label className="block text-body-sm font-medium text-fg mb-1">
              Причина анулювання (обов&apos;язково):
            </label>
            <textarea
              value={reason}
              onChange={(event) => onReason(event.target.value)}
              placeholder="Введіть детальну причину підозри або аб'юзу..."
              className="w-full rounded-input border border-border bg-surface p-3 text-fg h-24"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Скасувати
            </Button>
            <Button type="submit" variant="primary">
              Підтвердити анулювання
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
