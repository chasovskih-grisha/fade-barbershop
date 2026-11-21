'use client';

import BarberIdleGaps from './BarberIdleGaps';
import BarberPerformanceStats from './BarberPerformanceStats';
import BarberVacationSection from './BarberVacationSection';
import { useBarberPerformance } from './use-barber-performance';

export default function BarberPerformanceSection({ barberId }: { barberId: string }) {
  const { data, loading, error, submittingVacation, requestVacation } =
    useBarberPerformance(barberId);

  if (loading && !data) {
    return <div className="p-4 text-fg-muted">Завантаження показників продуктивності...</div>;
  }

  return (
    <section className="mt-3 rounded-card border border-line p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-h4 font-bold">Продуктивність та відпустки</h3>
        {data ? (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold bg-surface-raised text-fg">
            Рівень комісії: <strong className="ml-1 uppercase">{data.commissionTier}</strong> (Бонус
            ×{data.bonusMultiplier})
          </span>
        ) : null}
      </div>

      {data ? <BarberPerformanceStats data={data} /> : null}

      {data && data.idleGapsMinutes.length > 0 ? (
        <BarberIdleGaps barberId={barberId} gaps={data.idleGapsMinutes} />
      ) : null}

      {data ? (
        <BarberVacationSection
          requests={data.vacationRequests}
          submitting={submittingVacation}
          requestVacation={requestVacation}
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-semantic-danger text-caption">
          {error}
        </p>
      ) : null}
    </section>
  );
}
