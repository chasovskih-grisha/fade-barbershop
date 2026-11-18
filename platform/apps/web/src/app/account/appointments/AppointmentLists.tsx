'use client';

import { useState } from 'react';
import { EmptyState } from '@fade/ui';
import { ActionLink } from '@/app/components/ActionLink';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { AppointmentCard } from './AppointmentCard';
import { prepareVisits } from './prepare-visits';
import {
  VisitListControls,
  type VisitSortOrder,
  type VisitStatusFilter,
} from './VisitListControls';

type CardHandlers = {
  processingAction: string | null;
  onReschedule: (app: ExtendedAppointment) => void;
  onCancel: (app: ExtendedAppointment) => void;
  onEditReference: (app: ExtendedAppointment) => void;
};

export function AppointmentLists({
  upcoming,
  past,
  cardProps,
}: {
  upcoming: ExtendedAppointment[];
  past: ExtendedAppointment[];
  cardProps: CardHandlers;
}) {
  const [status, setStatus] = useState<VisitStatusFilter>('all');
  const [order, setOrder] = useState<VisitSortOrder>('desc');

  const visibleUpcoming = prepareVisits(upcoming, status, order);
  const visiblePast = prepareVisits(past, status, order);
  const shown = visibleUpcoming.length + visiblePast.length;
  const filtered = status !== 'all';

  return (
    <>
      <VisitListControls
        status={status}
        order={order}
        onStatusChange={setStatus}
        onOrderChange={setOrder}
        shown={shown}
      />
      {filtered && shown === 0 && (
        <EmptyState
          title="Нічого не знайдено"
          description="За обраним статусом візитів немає — змініть фільтр."
        />
      )}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-h4">Майбутні</h2>
        {visibleUpcoming.length > 0 ? (
          <div className="flex flex-col gap-4">
            {visibleUpcoming.map((app) => (
              <AppointmentCard key={app.id} app={app} {...cardProps} />
            ))}
          </div>
        ) : filtered ? null : (
          <EmptyState
            title="У вас немає майбутніх записів"
            description="Заплануйте свій наступний візит до барбера."
            action={<ActionLink href="/booking">Записатися</ActionLink>}
          />
        )}
      </section>
      <section className="flex flex-col gap-4 mt-4">
        <h2 className="font-display text-h4">Минулі</h2>
        {visiblePast.length > 0 ? (
          <div className="flex flex-col gap-4">
            {visiblePast.map((app) => (
              <AppointmentCard key={app.id} app={app} {...cardProps} />
            ))}
          </div>
        ) : filtered ? null : (
          <EmptyState
            title="Історія порожня"
            description="Тут з’явиться історія після першого візиту."
          />
        )}
      </section>
    </>
  );
}
