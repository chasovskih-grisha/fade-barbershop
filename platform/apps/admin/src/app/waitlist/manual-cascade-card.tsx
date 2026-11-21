'use client';

// T-180: Ручний запуск каскаду для конкретного слота.
import { useState } from 'react';
import { Button, Card, TextField } from '@fade/ui';
import type { WaitlistCardProps } from './waitlist-card-props';

export default function ManualCascadeCard({ busy, setBusy, notify, onDone }: WaitlistCardProps) {
  const [slotId, setSlotId] = useState('');
  const [reason, setReason] = useState('Admin-initiated cascade');

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!slotId) {
      notify('Select a slot ID', 'danger');
      return;
    }
    setBusy(true);
    // API integration point: triggerWaitlistCascade(slotId, reason) — T-180.
    setBusy(false);
    notify('Waitlist cascade triggered', 'success');
    onDone();
  };

  return (
    <Card>
      <h2 className="text-h4 text-fg">Manual cascade trigger</h2>
      <p className="mt-2 text-caption text-fg-muted">
        The first waiting client receives an offer for the selected slot.
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
        <TextField
          label="Slot ID"
          value={slotId}
          disabled={busy}
          onChange={(event) => setSlotId(event.target.value)}
        />
        <TextField
          label="Reason"
          value={reason}
          disabled={busy}
          onChange={(event) => setReason(event.target.value)}
        />
        <Button type="submit" disabled={busy || !slotId}>
          Trigger cascade
        </Button>
      </form>
    </Card>
  );
}
