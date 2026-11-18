'use client';

type Window = { dayOfWeek: number; start: string; end: string };

export function AvailabilityDayRow({
  day,
  dayOfWeek,
  windows,
  onUpdate,
}: {
  day: string;
  dayOfWeek: number;
  windows: Window[];
  onUpdate: (
    dayOfWeek: number,
    index: number,
    change: Partial<Pick<Window, 'start' | 'end'>>
  ) => void;
}) {
  const dayWindows = windows.filter((item) => item.dayOfWeek === dayOfWeek);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-28">{day}</span>
      {[0, 1].map((index) => (
        <div key={index} className="flex gap-1">
          <input
            aria-label={`${day}, вікно ${index + 1}, початок`}
            type="time"
            value={dayWindows[index]?.start ?? ''}
            onChange={(event) => onUpdate(dayOfWeek, index, { start: event.target.value })}
            className="rounded-input border border-line p-2"
          />
          <input
            aria-label={`${day}, вікно ${index + 1}, кінець`}
            type="time"
            value={dayWindows[index]?.end ?? ''}
            onChange={(event) => onUpdate(dayOfWeek, index, { end: event.target.value })}
            className="rounded-input border border-line p-2"
          />
        </div>
      ))}
    </div>
  );
}
