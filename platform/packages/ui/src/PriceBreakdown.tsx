import { cn } from './cn';
import { formatMoney } from './money';

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceBreakdownProps {
  service: PriceLine;
  discounts?: PriceLine[];
  finalAmount: number;
  className?: string;
}

export function PriceBreakdown({
  service,
  discounts = [],
  finalAmount,
  className,
}: PriceBreakdownProps) {
  return (
    <dl className={cn('flex flex-col gap-1 text-body', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-fg-secondary">{service.label}</dt>
        <dd className="text-fg tabular-nums">{formatMoney(service.amount)}</dd>
      </div>
      {discounts.map((discount) => (
        <div key={discount.label} className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-secondary">{discount.label}</dt>
          <dd className="text-semantic-success tabular-nums">
            −{formatMoney(Math.abs(discount.amount))}
          </dd>
        </div>
      ))}
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-2">
        <dt className="font-medium text-fg">Разом</dt>
        <dd className="font-display text-h4 text-fg tabular-nums">{formatMoney(finalAmount)}</dd>
      </div>
    </dl>
  );
}
