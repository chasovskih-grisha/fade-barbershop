/** T-180: Admin waitlist management dashboard. */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@fade/ui';
import PageHeader from '../components/PageHeader';
import { useAdminToasts } from '../components/use-admin-toasts';
import { useWaitlistConfig, useWaitlistSummary } from '../hooks/use-waitlist-config';
import AdjustPriorityCard from './adjust-priority-card';
import ManualCascadeCard from './manual-cascade-card';
import WaitlistConfigCard from './waitlist-config-card';
import WaitlistSummaryCard from './waitlist-summary-card';

export default function WaitlistDashboardPage() {
  const router = useRouter();
  const { push, viewport } = useAdminToasts();
  const { data: config, isLoading: configLoading, refresh } = useWaitlistConfig();
  const { data: summary, isLoading: summaryLoading, refetch } = useWaitlistSummary();
  const [busy, setBusy] = useState(false);

  if (configLoading || summaryLoading) {
    return <p className="text-fg-muted">Loading waitlist dashboard...</p>;
  }

  const notify = (title: string, tone: 'success' | 'danger'): void => push(title, tone);
  const done = (): void => {
    refresh();
    refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Waitlist management"
        subtitle="Configuration, live metrics and manual queue actions"
        actions={
          <Button variant="secondary" onClick={() => router.push('/')}>
            Back to dashboard
          </Button>
        }
      />
      <WaitlistConfigCard config={config} />
      <WaitlistSummaryCard summary={summary} />
      <ManualCascadeCard busy={busy} setBusy={setBusy} notify={notify} onDone={done} />
      <AdjustPriorityCard busy={busy} setBusy={setBusy} notify={notify} onDone={done} />
      {viewport}
    </div>
  );
}
