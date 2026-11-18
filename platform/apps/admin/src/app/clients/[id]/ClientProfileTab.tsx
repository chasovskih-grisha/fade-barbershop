'use client';

import { Card, Badge, Button } from '@fade/ui';

export function ClientProfileTab({
  name,
  phone,
  vipDiscount,
  currentVipPercent,
  saving,
  onVipChange,
  onSaveVip,
}: {
  name: string | null;
  phone: string;
  vipDiscount: number | null;
  currentVipPercent: number | null;
  saving: boolean;
  onVipChange: (value: number | null) => void;
  onSaveVip: () => void;
}) {
  return (
    <Card className="p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-caption text-fg-secondary mb-1">Ім’я</label>
          <input
            type="text"
            value={name ?? ''}
            className="w-full rounded-input border border-line bg-surface-base px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          />
        </div>
        <div>
          <label className="block text-caption text-fg-secondary mb-1">Телефон</label>
          <input
            type="tel"
            value={phone}
            readOnly
            className="w-full rounded-input border border-line bg-surface-base px-3 py-2 text-body bg-surface-raised"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-caption text-fg-secondary mb-2">VIP-знижка (%)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="100"
            value={vipDiscount ?? ''}
            onChange={(e) => onVipChange(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="w-24 rounded-input border border-line bg-surface-base px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          />
          <Button variant="primary" size="md" onClick={onSaveVip} disabled={saving}>
            {saving ? 'Збереження…' : 'Зберегти'}
          </Button>
          {currentVipPercent && <Badge tone="success">Поточна: {currentVipPercent}%</Badge>}
        </div>
      </div>
    </Card>
  );
}
