import type { BarberPerformanceData } from './use-barber-performance';
import { vacationLabel, vacationTone } from './vacation-types';

export default function VacationRequestList({
  requests,
}: {
  requests: BarberPerformanceData['vacationRequests'];
}) {
  if (requests.length === 0) {
    return <p className="text-body text-fg-muted mb-4">Немає активних запитів на відпустку.</p>;
  }

  return (
    <ul className="space-y-2 mb-4">
      {requests.map((vacation) => (
        <li
          key={vacation.id}
          className="flex items-center justify-between rounded-input border border-line p-2 text-body"
        >
          <span>
            {vacation.startDate} — {vacation.endDate} ({vacation.reason})
          </span>
          <span
            className={`px-2 py-0.5 rounded text-caption font-medium ${vacationTone(vacation.status)}`}
          >
            {vacationLabel(vacation.status)}
          </span>
        </li>
      ))}
    </ul>
  );
}
