'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';

export interface ShiftSlot {
  dayOfWeek: number;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "19:00"
  isOvertime?: boolean;
}

export interface StaffScheduleOvertimeGuardProps {
  barberId: string;
  barberName: string;
  maxWeeklyHours?: number; // default 40
  initialShifts?: ShiftSlot[];
  onSaveSchedule: (shifts: ShiftSlot[]) => Promise<boolean>;
  saving?: boolean;
}

const DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'];

export default function StaffScheduleOvertimeGuard({
  barberId: _barberId,
  barberName,
  maxWeeklyHours = 40,
  initialShifts = [],
  onSaveSchedule,
  saving,
}: StaffScheduleOvertimeGuardProps) {
  const [shifts, setShifts] = useState<ShiftSlot[]>(
    initialShifts.length > 0
      ? initialShifts
      : [
          { dayOfWeek: 0, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
        ]
  );
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const calculateTotalHours = (currentShifts: ShiftSlot[]) => {
    return currentShifts.reduce((acc, shift) => {
      const [startH = 0, startM = 0] = shift.startTime.split(':').map(Number);
      const [endH = 0, endM = 0] = shift.endTime.split(':').map(Number);
      const hours = (endH + endM / 60) - (startH + startM / 60);
      return acc + (isNaN(hours) || hours < 0 ? 0 : hours);
    }, 0);
  };

  const totalHours = calculateTotalHours(shifts);
  const isOvertime = totalHours > maxWeeklyHours;

  const handleShiftChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...shifts];
    const current = updated[index];
    if (current) {
      updated[index] = {
        dayOfWeek: current.dayOfWeek,
        startTime: field === 'startTime' ? value : current.startTime,
        endTime: field === 'endTime' ? value : current.endTime,
      };
    }
    setShifts(updated);
  };

  const handleToggleWorkDay = (dayIndex: number) => {
    const existsIndex = shifts.findIndex((s) => s.dayOfWeek === dayIndex);
    if (existsIndex >= 0) {
      setShifts(shifts.filter((_, idx) => idx !== existsIndex));
    } else {
      setShifts([...shifts, { dayOfWeek: dayIndex, startTime: '09:00', endTime: '17:00' }].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isOvertime) {
      setErrorMsg(`Попередження: Загальний тижневий час (${totalHours.toFixed(1)} год) перевищує ліміт понаднормових (${maxWeeklyHours} год)! Погодьте овертайм у керівника.`);
      return;
    }

    const ok = await onSaveSchedule(shifts);
    if (ok) {
      setSuccessMsg('Графік та ліміти робочих годин успішно збережено');
    } else {
      setErrorMsg('Не вдалося зберегти графік через помилку сервера');
    }
  };

  return (
    <div className="rounded-card border border-line p-4 space-y-4 bg-surface-base">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-h5 font-bold">Контроль графіку та овертайму: {barberName}</h4>
          <p className="text-caption text-fg-muted">Моніторинг робочих годин, попередження понаднормових та захист від вигорання</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold ${isOvertime ? 'bg-semantic-danger/20 text-semantic-danger border border-semantic-danger' : 'bg-interactive text-fg'}`}>
            Всього: {totalHours.toFixed(1)} / {maxWeeklyHours} год
          </span>
          {isOvertime && (
            <p className="text-caption text-semantic-danger mt-1 font-medium">⚠️ Перевищення ліміту овертайму</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-caption font-medium mb-1">Виберіть робочі дні тижня та зміни:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {DAYS.map((dayName, dayIndex) => {
              const shift = shifts.find((s) => s.dayOfWeek === dayIndex);
              const isWorking = !!shift;
              return (
                <div key={dayName} className={`p-3 rounded-card border ${isWorking ? 'border-interactive bg-surface-raised' : 'border-line bg-surface-base opacity-70'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-body">{dayName}</span>
                    <input
                      type="checkbox"
                      aria-label={`Робочий день ${dayName}`}
                      checked={isWorking}
                      onChange={() => handleToggleWorkDay(dayIndex)}
                      className="rounded border-line text-interactive focus:ring-interactive"
                    />
                  </div>
                  {isWorking && shift && (
                    <div className="grid grid-cols-2 gap-2 text-caption">
                      <label>
                        З
                        <input
                          type="time"
                          aria-label={`${dayName}, початок зміни`}
                          value={shift.startTime}
                          onChange={(e) => {
                            const idx = shifts.findIndex((s) => s.dayOfWeek === dayIndex);
                            if (idx >= 0) handleShiftChange(idx, 'startTime', e.target.value);
                          }}
                          className="mt-1 w-full rounded-input border border-line bg-surface-base p-1 text-xs"
                        />
                      </label>
                      <label>
                        До
                        <input
                          type="time"
                          aria-label={`${dayName}, кінець зміни`}
                          value={shift.endTime}
                          onChange={(e) => {
                            const idx = shifts.findIndex((s) => s.dayOfWeek === dayIndex);
                            if (idx >= 0) handleShiftChange(idx, 'endTime', e.target.value);
                          }}
                          className="mt-1 w-full rounded-input border border-line bg-surface-base p-1 text-xs"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="md"
            type="submit"
            disabled={saving || isOvertime}
          >
            {saving ? 'Збереження...' : isOvertime ? 'Блоковано (Овертайм)' : 'Зберегти захищений графік'}
          </Button>
          {successMsg && <span className="text-semantic-success text-caption font-medium">{successMsg}</span>}
          {errorMsg && <span role="alert" className="text-semantic-danger text-caption font-medium">{errorMsg}</span>}
        </div>
      </form>
    </div>
  );
}
