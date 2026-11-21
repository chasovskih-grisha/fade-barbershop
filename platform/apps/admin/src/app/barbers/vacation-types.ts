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

export function vacationTone(status: VacationRequestItem['status']): string {
  if (status === 'approved') return 'bg-semantic-success/20 text-semantic-success';
  if (status === 'rejected') return 'bg-semantic-danger/20 text-semantic-danger';
  return 'bg-surface-raised text-fg-muted';
}

export function vacationLabel(status: VacationRequestItem['status']): string {
  if (status === 'approved') return 'Схвалено';
  if (status === 'rejected') return 'Відхилено';
  return 'На розгляді';
}
