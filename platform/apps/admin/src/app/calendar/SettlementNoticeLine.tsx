'use client';

// Рядок результату рішення (T-4616b): текст + повтор невдалого повернення.
import { Button } from '@fade/ui';
import type { SettlementNotice } from './settlement-notice';

export function SettlementNoticeLine({
  notice,
  retrying,
  onRetry,
}: {
  notice: SettlementNotice;
  retrying: boolean;
  onRetry: (refundId: string) => void;
}) {
  const { refundId } = notice;
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
      <p>{notice.text}</p>
      {refundId && (
        <Button variant="secondary" size="md" disabled={retrying} onClick={() => onRetry(refundId)}>
          Повторити повернення
        </Button>
      )}
    </div>
  );
}
