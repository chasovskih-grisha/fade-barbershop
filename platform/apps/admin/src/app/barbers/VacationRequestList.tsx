'use client';

import { Button } from '@fade/ui';
import type { VacationRequestItem } from './vacation-types';

type ApproveReject = (requestId: string, status: 'approved' | 'rejected') => Promise<boolean>;

function badge(status: VacationRequestItem['status']): { tone: string; label: string } {
  if (status === 'approved') {
    return {
      tone: 'bg-semantic-success/20 text-semantic-success',
      label: 'Схвалено (Слоти заблоковано)',
    };
  }
  if (status === 'rejected') {
    return { tone: 'bg-semantic-danger/20 text-semantic-danger', label: 'Відхилено' };
  }
  return { tone: 'bg-semantic-warning/20 text-semantic-warning', label: 'Очікує схвалення' };
}

export default function VacationRequestList({
  requests,
  onApproveRejectRequest,
  onResult,
}: {
  requests: VacationRequestItem[];
  onApproveRejectRequest: ApproveReject;
  onResult: (ok: boolean, message: string) => void;
}) {
  const act = async (id: string, status: 'approved' | 'rejected'): Promise<void> => {
    const ok = await onApproveRejectRequest(id, status);
    onResult(
      ok,
      ok
        ? status === 'approved'
          ? 'Заявку схвалено, слоти заблоковано автоматично'
          : 'Заявку відхилено'
        : 'Не вдалося оновити статус заявки'
    );
  };

  return (
    <div className="space-y-2">
      <h5 className="font-display text-fg-secondary font-semibold">
        Історія заявок та статус схвалення
      </h5>
      {requests.length === 0 ? (
        <p className="text-caption text-fg-muted py-2">
          Немає активних або минулих заявок на відпустку.
        </p>
      ) : (
        requests.map((request) => {
          const view = badge(request.status);
          return (
            <div
              key={request.id}
              className="flex items-center justify-between p-3 rounded-card border border-line bg-surface-raised"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-body">
                    {request.startDate} — {request.endDate}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${view.tone}`}
                  >
                    {view.label}
                  </span>
                </div>
                <p className="text-caption text-fg-muted mt-0.5">{request.reason}</p>
              </div>
              {request.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void act(request.id, 'approved')}
                  >
                    Схвалити
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void act(request.id, 'rejected')}
                  >
                    Відхилити
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
