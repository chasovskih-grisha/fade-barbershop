import Link from 'next/link';
import { BEARD_CARE, SHAMPOO_RITUAL, type BundleTotals } from './service-pricing-calculations';

interface PricingSummaryProps {
  totals: BundleTotals;
  includeBeardCare: boolean;
  includeShampoo: boolean;
}

export function PricingSummary({ totals, includeBeardCare, includeShampoo }: PricingSummaryProps) {
  const { selectedServices, hasBundle, discount, baseTotal, finalTotal, totalDuration } = totals;
  const isEmpty = selectedServices.length === 0 && !includeBeardCare && !includeShampoo;

  return (
    <div className="lg:col-span-5 flex flex-col justify-between rounded-card border border-line bg-surface p-6 shadow-xl">
      <div className="flex flex-col gap-4">
        <h3 className="font-display text-h4 font-bold text-fg border-b border-line pb-3 flex items-center justify-between">
          <span>Підсумок пакета</span>
          <span className="text-caption font-normal text-fg-secondary">
            {totalDuration} хв загалом
          </span>
        </h3>

        {isEmpty ? (
          <div className="py-8 text-center text-fg-secondary text-body">
            Будь ласка, оберіть послуги ліворуч, щоб сформувати комплексний візит.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1">
            {selectedServices.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-body">
                <span className="text-fg truncate pr-2">{s.name}</span>
                <span className="font-semibold text-fg shrink-0">{s.price} ₴</span>
              </div>
            ))}
            {includeBeardCare && (
              <div className="flex items-center justify-between text-body">
                <span className="text-fg">{BEARD_CARE.name}</span>
                <span className="font-semibold text-fg shrink-0">{BEARD_CARE.price} ₴</span>
              </div>
            )}
            {includeShampoo && (
              <div className="flex items-center justify-between text-body">
                <span className="text-fg">{SHAMPOO_RITUAL.name}</span>
                <span className="font-semibold text-fg shrink-0">{SHAMPOO_RITUAL.price} ₴</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 pt-6 border-t border-line mt-4">
        {hasBundle && (
          <div className="flex items-center justify-between text-caption text-semantic-success font-semibold bg-semantic-success/10 px-3 py-2 rounded-input border border-semantic-success/20">
            <span>Знижка комбо-пакету (-12%)</span>
            <span>-{discount} ₴</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-body font-display text-fg-secondary">До сплати:</span>
          <div className="text-right">
            {hasBundle && (
              <div className="text-caption text-fg-secondary line-through">{baseTotal} ₴</div>
            )}
            <div className="text-2xl font-bold font-display text-fg">{finalTotal} ₴</div>
          </div>
        </div>

        <Link
          href="/booking"
          className={`inline-flex h-12 items-center justify-center rounded-input bg-accent px-6 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-md text-center ${
            isEmpty ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          Записатися за 60 секунд &rarr;
        </Link>
      </div>
    </div>
  );
}
