'use client';

import { DAYS, type ShiftSlot } from './overtime-schedule';

export default function ShiftDayGrid({
  shifts,
  onToggle,
  onTimeChange,
}: {
  shifts: ShiftSlot[];
  onToggle: (dayIndex: number) => void;
  onTimeChange: (dayIndex: number, field: 'startTime' | 'endTime', value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-caption font-medium mb-1">
        Виберіть робочі дні тижня та зміни:
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {DAYS.map((dayName, dayIndex) => {
          const shift = shifts.find((item) => item.dayOfWeek === dayIndex);
          const isWorking = Boolean(shift);
          return (
            <div
              key={dayName}
              className={`p-3 rounded-card border ${isWorking ? 'border-interactive bg-surface-raised' : 'border-line bg-surface-base opacity-70'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-body">{dayName}</span>
                <input
                  type="checkbox"
                  aria-label={`Робочий день ${dayName}`}
                  checked={isWorking}
                  onChange={() => onToggle(dayIndex)}
                  className="rounded border-line text-interactive focus:ring-interactive"
                />
              </div>
              {isWorking && shift ? (
                <div className="grid grid-cols-2 gap-2 text-caption">
                  <label>
                    З
                    <input
                      type="time"
                      aria-label={`${dayName}, початок зміни`}
                      value={shift.startTime}
                      onChange={(event) => onTimeChange(dayIndex, 'startTime', event.target.value)}
                      className="mt-1 w-full rounded-input border border-line bg-surface-base p-1 text-xs"
                    />
                  </label>
                  <label>
                    До
                    <input
                      type="time"
                      aria-label={`${dayName}, кінець зміни`}
                      value={shift.endTime}
                      onChange={(event) => onTimeChange(dayIndex, 'endTime', event.target.value)}
                      className="mt-1 w-full rounded-input border border-line bg-surface-base p-1 text-xs"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
