'use client';

// T-180: Ручне коригування пріоритету клієнта у черзі очікування.
import { useState } from 'react';
import { Button, Card, TextField } from '@fade/ui';
import type { WaitlistCardProps } from './waitlist-card-props';

export default function AdjustPriorityCard({ busy, setBusy, notify, onDone }: WaitlistCardProps) {
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('0');
  const [reason, setReason] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!clientId) {
      notify('Select a client ID', 'danger');
      return;
    }
    setBusy(true);
    // API integration point: adjustWaitlistPriority(clientId, Number(amount), reason) — T-180.
    setBusy(false);
    notify('Priority adjusted', 'success');
    onDone();
  };

  return (
    <Card>
      <h2 className="text-h4 text-fg">Adjust client priority</h2>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
        <TextField
          label="Client ID"
          value={clientId}
          disabled={busy}
          onChange={(event) => setClientId(event.target.value)}
        />
        <TextField
          label="Adjustment"
          type="number"
          step={1}
          value={amount}
          disabled={busy}
          onChange={(event) => setAmount(event.target.value)}
        />
        <TextField
          label="Reason"
          value={reason}
          disabled={busy}
          onChange={(event) => setReason(event.target.value)}
        />
        <Button type="submit" disabled={busy || !clientId}>
          Adjust priority
        </Button>
      </form>
    </Card>
  );
}
