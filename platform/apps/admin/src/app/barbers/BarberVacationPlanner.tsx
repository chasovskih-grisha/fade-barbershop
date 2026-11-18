'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';

export interface VacationRequestItem {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface BarberVacationPlannerProps {
  barberId: string;
  barberName: string;
  requests: VacationRequestItem[];
  onRequestVacation: (startDate: string, endDate: string, reason: string) => Promise<boolean>;
  onApproveRejectRequest: (requestId: string, status: 'approved' | 'rejected') => Promise<boolean>;
  saving?: boolean;
}

export default function BarberVacationPlanner({
  barberName,
  requests,
  onRequestVacation,
  onApproveRejectRequest,
  saving,
}: BarberVacationPlannerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!startDate || !endDate) {
      setErrorMsg('Будь ласка, вкажіть дати початку та закінчення відпустки');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Дата початку не може бути пізнішою за дату закінчення');
      return;
    }

    const ok = await onRequestVacation(startDate, endDate, reason || 'Відпустка / Особисті обставини');
    if (ok) {
      setSuccessMsg('Заявку на відпустку успішно створено та надіслано на затвердження');
      setStartDate('');
      setEndDate('');
      setReason('');
    } else {
      setErrorMsg('Не вдалося створити заявку на відпустку');
    }
  };

  const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
    setErrorMsg('');
    setSuccessMsg('');
    const ok = await onApproveRejectRequest(requestId, status);
    if (ok) {
      setSuccessMsg(status === 'approved' ? 'Заявку схвалено, слоти заблоковано автоматично' : 'Заявку відхилено');
    } else {
      setErrorMsg('Не вдалося оновити статус заявки');
    }
  };

  return (
    <div className="rounded-card border border-line p-4 space-y-4 bg-surface-base">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-h5 font-bold">Планувальник відпусток та лікарняних: {barberName}</h4>
          <p className="text-caption text-fg-muted">Подача заявок, схвалення адміністратором та автоматичне блокування слотів (T-4547)</p>
        </div>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold bg-interactive text-fg">
          Всього заявок: {requests.length}
        </span>
      </div>

      <form onSubmit={handleRequest} className="space-y-3 p-3 rounded-card bg-surface-raised border border-line">
        <h5 className="font-display text-fg-secondary font-semibold">Нова заявка на відпустку / лікарняний</h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block text-caption">
            Дата початку
            <input
              type="date"
              aria-label="Дата початку відпустки"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-input border border-line bg-surface-base p-2 text-body text-fg"
            />
          </label>
          <label className="block text-caption">
            Дата закінчення
            <input
              type="date"
              aria-label="Дата закінчення відпустки"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-input border border-line bg-surface-base p-2 text-body text-fg"
            />
          </label>
          <label className="block text-caption">
            Причина / Коментар
            <input
              type="text"
              aria-label="Причина відпустки"
              placeholder="Напр. Щорічна відпустка"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-input border border-line bg-surface-base p-2 text-body text-fg"
            />
          </label>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Button variant="secondary" size="md" type="submit" disabled={saving}>
            {saving ? 'Надсилання...' : 'Подати заявку'}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <h5 className="font-display text-fg-secondary font-semibold">Історія заявок та статус схвалення</h5>
        {requests.length === 0 ? (
          <p className="text-caption text-fg-muted py-2">Немає активних або минулих заявок на відпустку.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-card border border-line bg-surface-raised">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-body">{req.startDate} — {req.endDate}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      req.status === 'approved' ? 'bg-semantic-success/20 text-semantic-success' :
                      req.status === 'rejected' ? 'bg-semantic-danger/20 text-semantic-danger' :
                      'bg-semantic-warning/20 text-semantic-warning'
                    }`}>
                      {req.status === 'approved' ? 'Схвалено (Слоти заблоковано)' : req.status === 'rejected' ? 'Відхилено' : 'Очікує схвалення'}
                    </span>
                  </div>
                  <p className="text-caption text-fg-muted mt-0.5">{req.reason}</p>
                </div>
                {req.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => void handleAction(req.id, 'approved')}>
                      Схвалити
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleAction(req.id, 'rejected')}>
                      Відхилити
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {(successMsg || errorMsg) && (
        <div className="pt-1">
          {successMsg && <span className="text-semantic-success text-caption font-medium">{successMsg}</span>}
          {errorMsg && <span role="alert" className="text-semantic-danger text-caption font-medium">{errorMsg}</span>}
        </div>
      )}
    </div>
  );
}
