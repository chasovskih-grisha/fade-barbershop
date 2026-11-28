// Картки візитів барбера: активні — без дій, позатижневі — з оплатою на місці.
// Винесено з page.tsx (max-lines), розмітка не змінилась.
import { Button, Card, Skeleton, formatMoney } from '@fade/ui';
import type { ClientAppointmentView } from '@/lib/api/barber-appointments';
import { dateLabel } from './barber-date-label';

/** PAY-ONS-01 / WALK-BAR-03: барбер позначає решту лише на walk-in візиті
 *  після послуги. Решту онлайн-візиту позначає адміністратор (або клієнт сам
 *  з кабінету), тож кнопка на такому рядку обіцяла б дію поза політикою.
 */
export function canMarkOnsite(visit: ClientAppointmentView): boolean {
  return visit.source === 'walk_in' && visit.status === 'completed';
}

export function VisitsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-24" />
        </Card>
      ))}
    </div>
  );
}

export function ActiveVisitCard({ visit }: { visit: ClientAppointmentView }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-bodyLg">
            {visit.serviceName} • {visit.barberName}
          </p>
          <p className="text-body-s text-fg-secondary mt-0.5">
            {dateLabel(visit.date, visit.endTime)}
          </p>
          <p className="text-body-s text-fg-secondary mt-0.5">{visit.locationName}</p>
        </div>
        <p className="text-right font-medium tabular-nums">{formatMoney(visit.price)}</p>
      </div>
    </Card>
  );
}

export function PastVisitCard({
  visit,
  payBusy,
  onPay,
}: {
  visit: ClientAppointmentView;
  payBusy: boolean;
  onPay: (bookingId: string) => void;
}) {
  return (
    <Card className={`p-5 ${canMarkOnsite(visit) ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-bodyLg">
            {visit.serviceName} • {visit.barberName}
          </p>
          <p className="text-body-s text-fg-secondary mt-0.5">
            {dateLabel(visit.date, visit.endTime)}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular-nums">{formatMoney(visit.price)}</p>
          {canMarkOnsite(visit) && (
            <Button
              variant="primary"
              size="md"
              className="mt-2 w-fit"
              onClick={() => onPay(visit.id)}
              disabled={payBusy}
            >
              Оплатити на місці
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
