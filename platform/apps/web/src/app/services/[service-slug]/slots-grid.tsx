'use client';
// Стрічка слотів детальної послуги: клік → /booking з преселектом часу;
// зайняті слоти — disabled; notFound/empty → чесна підказка.
import type { LoadableList } from '@/lib/api/loadable';

type Slots = LoadableList<{ start: string; end: string; barbers: string[] }>;

const Hint = ({ text }: { text: string }) => <p className="text-body text-fg-muted">{text}</p>;

export function SlotsGrid({
  slotsResult,
  bookingHref,
}: {
  slotsResult: Slots;
  bookingHref: (slot?: { start: string; end: string }) => string;
}) {
  if (slotsResult.state === 'error') return <Hint text={slotsResult.message} />;
  if (slotsResult.state !== 'ok' || slotsResult.data.length === 0)
    return <Hint text="На сьогодні немає вільних вікон" />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {slotsResult.data.map((slot) => {
        const isAvailable = slot.barbers.length > 0;
        return (
          <button
            key={slot.start}
            type="button"
            disabled={!isAvailable}
            onClick={() => (window.location.href = bookingHref(slot))}
            className={`group relative flex flex-col items-start rounded-input border p-3 text-left transition-all duration-150 ${
              isAvailable
                ? 'border-line bg-surface-raised hover:border-line-strong hover:bg-interactive cursor-pointer'
                : 'border-line/40 bg-surface-sunken opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="font-display text-bodyLg font-semibold text-fg">
              {slot.start}
            </span>
            <span className="text-caption text-fg-secondary">
              {isAvailable ? `${slot.barbers.length} майстер(-ів)` : 'Зайнято'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
