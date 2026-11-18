'use client';

// Дії над візитом у картці «Моїх візитів». Тільки перенесення й скасування:
// оплата депозиту й відгук прибрані разом із мертвим UI — маршрутів
// pay-deposit і review не існує, тож кнопки були недосяжними.
import { Button } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';

export function AppointmentActions({
  app,
  processingAction,
  onReschedule,
  onCancel,
}: {
  app: ExtendedAppointment;
  processingAction: string | null;
  onReschedule: (app: ExtendedAppointment) => void;
  onCancel: (app: ExtendedAppointment) => void;
}) {
  const isUpcoming = app.status === 'upcoming' || app.status === 'confirmed';

  if (!isUpcoming) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="md"
        className="flex-1 sm:flex-none"
        onClick={() => onReschedule(app)}
        disabled={processingAction?.startsWith('reschedule')}
      >
        Перенести
      </Button>
      <Button
        variant="ghost"
        size="md"
        className="flex-1 sm:flex-none text-semantic-danger"
        onClick={() => onCancel(app)}
        disabled={processingAction?.startsWith('cancel')}
      >
        Скасувати
      </Button>
    </div>
  );
}
