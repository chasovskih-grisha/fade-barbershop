'use client';

import { Button } from '@fade/ui';

export default function NewLocationActions({
  saving,
  onCancel,
}: {
  saving: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-3">
      <Button type="submit" disabled={saving}>
        {saving ? 'Створення…' : 'Створити локацію'}
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
        Скасувати
      </Button>
    </div>
  );
}
