'use client';

import { Button, Dialog } from '@fade/ui';

export function UnsavedChangesPrompt({
  open,
  saving,
  onSave,
  onDiscard,
  onStay,
}: {
  open: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onStay: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onStay}
      title="Зберегти зміни?"
      description="Ви змінили профіль. Зберегти перед переходом?"
      footer={
        <div className="flex flex-col gap-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти'}
          </Button>
          <Button variant="secondary" onClick={onDiscard} disabled={saving}>
            Не зберігати
          </Button>
          <Button variant="ghost" onClick={onStay} disabled={saving}>
            Залишитись
          </Button>
        </div>
      }
    >
      <span />
    </Dialog>
  );
}
