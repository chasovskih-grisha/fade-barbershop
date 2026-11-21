'use client';

import { Card, Badge, formatMoney } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { AppointmentActions } from './AppointmentActions';
import { AppointmentReference } from './AppointmentReference';
import { BookAgainButton } from './BookAgainButton';
import { depositDeadlineNote } from './deposit-summary';

const statusLabels: Record<
  ExtendedAppointment['status'],
  { tone: 'info' | 'success' | 'neutral'; label: string }
> = {
  upcoming: { tone: 'info', label: 'Очікується' },
  confirmed: { tone: 'success', label: 'Підтверджено' },
  completed: { tone: 'success', label: 'Завершено' },
  cancelled: { tone: 'neutral', label: 'Скасовано' },
};

export function AppointmentCard({
  app,
  processingAction,
  onReschedule,
  onCancel,
  onEditReference,
}: {
  app: ExtendedAppointment;
  processingAction: string | null;
  onReschedule: (app: ExtendedAppointment) => void;
  onCancel: (app: ExtendedAppointment) => void;
  onEditReference: (app: ExtendedAppointment) => void;
}) {
  const cfg = statusLabels[app.status];
  const depositAmount = app.deposit?.amount ?? 0;
  // Дедлайн рахується від снепшота візиту; сума 0 — грошей у візиті немає.
  const depositNote = depositAmount > 0 ? depositDeadlineNote(app, new Date()) : null;

  return (
    <Card className="flex flex-col gap-4 p-5 transition-all duration-200 hover:border-fg/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-bodyLg text-fg">
              {app.date} о {app.startTime}
            </span>
          </div>
          <span className="text-body-s text-fg-secondary truncate mt-0.5">{app.locationName}</span>
        </div>
        <Badge tone={cfg.tone}>{cfg.label}</Badge>
      </div>
      <div className="border-t border-border/60 pt-3">
        <p className="text-body-s text-fg-secondary mb-1 uppercase tracking-wider text-[11px]">
          Послуга та майстер
        </p>
        <p className="font-medium text-fg">
          {app.serviceName} • {app.barberName}
        </p>
      </div>
      <AppointmentReference app={app} onEditReference={onEditReference} />
      <div className="border-t border-border/60 pt-3 flex items-baseline justify-between gap-4">
        <span className="text-body-s text-fg-secondary">Вартість послуги</span>
        <span className="font-display text-display text-fg tabular-nums font-medium">
          {formatMoney(app.price)}
        </span>
      </div>
      {depositAmount > 0 ? (
        <div className="border-t border-border/60 pt-3 flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-body-s text-fg-secondary">Депозит</span>
            <span className="font-medium text-fg tabular-nums">{formatMoney(depositAmount)}</span>
          </div>
          {depositNote ? <p className="text-body-s text-fg-secondary">{depositNote}</p> : null}
        </div>
      ) : null}
      <AppointmentActions
        app={app}
        processingAction={processingAction}
        onReschedule={onReschedule}
        onCancel={onCancel}
      />
      {app.status === 'completed' && app.canBookAgain ? (
        <BookAgainButton appointmentId={app.id} />
      ) : null}
    </Card>
  );
}
