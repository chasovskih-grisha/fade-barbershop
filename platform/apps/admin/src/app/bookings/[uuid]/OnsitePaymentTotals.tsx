import { money } from './booking-format';
import type { OnsiteStatus } from './onsite-payment-types';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="text-body font-semibold text-fg">{value}</dd>
    </div>
  );
}

export function OnsitePaymentTotals({ status }: { status: OnsiteStatus }) {
  return (
    <dl className="divide-y divide-line">
      <Row label="Ціна візиту" value={money(status.finalPrice)} />
      <Row label="Сплачений депозит" value={money(status.depositAmount)} />
      <Row label="Решта до сплати" value={money(status.outstanding)} />
    </dl>
  );
}
