'use client';

import type { BarberPerformanceData } from './use-barber-performance';
import VacationRequestForm from './vacation-request-form';
import VacationRequestList from './vacation-request-list';

type RequestVacation = (start: string, end: string, reason: string) => Promise<boolean>;

export default function BarberVacationSection({
  requests,
  submitting,
  requestVacation,
}: {
  requests: BarberPerformanceData['vacationRequests'];
  submitting: boolean;
  requestVacation: RequestVacation;
}) {
  return (
    <div className="border-t border-line pt-4">
      <h4 className="font-display font-semibold mb-2">Запити на відпустку та вихідні</h4>
      <VacationRequestList requests={requests} />
      <VacationRequestForm submitting={submitting} requestVacation={requestVacation} />
    </div>
  );
}
