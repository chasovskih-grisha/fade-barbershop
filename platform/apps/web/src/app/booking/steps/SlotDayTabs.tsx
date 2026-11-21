import type { DayOption } from '../useBookingFlow';

interface SlotDayTabsProps {
  days: DayOption[];
  date: string;
  onDate: (date: string) => void;
}

export function SlotDayTabs({ days, date, onDate }: SlotDayTabsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-none [-webkit-overflow-scrolling:touch]"
      role="tablist"
      aria-label="Дата візиту"
    >
      {days.map((day) => (
        <button
          key={day.date}
          role="tab"
          aria-selected={day.date === date}
          onClick={() => onDate(day.date)}
          // prettier-ignore
          className={`whitespace-nowrap rounded-pill border border-line px-3 py-1 text-sm ${day.date === date ? 'bg-fg text-surface' : 'bg-surface hover:bg-interactive'}`}
        >
          {`${day.label} ${day.date.slice(8)}.${day.date.slice(5, 7)}`}
        </button>
      ))}
    </div>
  );
}
