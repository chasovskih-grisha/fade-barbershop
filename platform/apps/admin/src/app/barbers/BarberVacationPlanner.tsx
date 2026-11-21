'use client';

import { useState } from 'react';
import VacationRequestForm from './VacationRequestForm';
import VacationRequestList from './VacationRequestList';
import type { BarberVacationPlannerProps } from './vacation-types';

export type { VacationRequestItem, BarberVacationPlannerProps } from './vacation-types';

export default function BarberVacationPlanner({
  barberName,
  requests,
  onRequestVacation,
  onApproveRejectRequest,
  saving,
}: BarberVacationPlannerProps) {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const result = (ok: boolean, message: string): void => {
    if (ok) {
      setSuccessMsg(message);
      setErrorMsg('');
    } else {
      setErrorMsg(message);
      setSuccessMsg('');
    }
  };

  return (
    <div className="rounded-card border border-line p-4 space-y-4 bg-surface-base">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-h5 font-bold">
            Планувальник відпусток та лікарняних: {barberName}
          </h4>
          <p className="text-caption text-fg-muted">
            Подача заявок, схвалення адміністратором та автоматичне блокування слотів (T-4547)
          </p>
        </div>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold bg-interactive text-fg">
          Всього заявок: {requests.length}
        </span>
      </div>

      <VacationRequestForm saving={saving} requestVacation={onRequestVacation} onResult={result} />
      <VacationRequestList
        requests={requests}
        onApproveRejectRequest={onApproveRejectRequest}
        onResult={result}
      />

      {successMsg ? (
        <span className="text-semantic-success text-caption font-medium">{successMsg}</span>
      ) : null}
      {errorMsg ? (
        <span role="alert" className="text-semantic-danger text-caption font-medium">
          {errorMsg}
        </span>
      ) : null}
    </div>
  );
}
