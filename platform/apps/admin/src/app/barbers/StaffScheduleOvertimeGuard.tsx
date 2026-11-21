'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';
import ShiftDayGrid from './ShiftDayGrid';
import {
  DEFAULT_SHIFTS,
  toggledShifts,
  totalHours,
  updatedShift,
  type StaffScheduleOvertimeGuardProps,
} from './overtime-schedule';

export type { ShiftSlot, StaffScheduleOvertimeGuardProps } from './overtime-schedule';

export default function StaffScheduleOvertimeGuard({
  barberName,
  maxWeeklyHours = 40,
  initialShifts = [],
  onSaveSchedule,
  saving,
}: StaffScheduleOvertimeGuardProps) {
  const [shifts, setShifts] = useState(initialShifts.length > 0 ? initialShifts : DEFAULT_SHIFTS);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const hours = totalHours(shifts);
  const isOvertime = hours > maxWeeklyHours;

  const changeTime = (dayIndex: number, field: 'startTime' | 'endTime', value: string): void => {
    const index = shifts.findIndex((shift) => shift.dayOfWeek === dayIndex);
    if (index >= 0) setShifts(updatedShift({ shifts, index, field, value }));
  };

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (isOvertime) {
      setErrorMsg(
        `Попередження: Загальний тижневий час (${hours.toFixed(1)} год) перевищує ліміт понаднормових (${maxWeeklyHours} год)! Погодьте овертайм у керівника.`
      );
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
          <h4 className="font-display text-h5 font-bold">
            Контроль графіку та овертайму: {barberName}
          </h4>
          <p className="text-caption text-fg-muted">
            Моніторинг робочих годин, попередження понаднормових та захист від вигорання
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold ${isOvertime ? 'bg-semantic-danger/20 text-semantic-danger border border-semantic-danger' : 'bg-interactive text-fg'}`}
          >
            Всього: {hours.toFixed(1)} / {maxWeeklyHours} год
          </span>
          {isOvertime ? (
            <p className="text-caption text-semantic-danger mt-1 font-medium">
              ⚠️ Перевищення ліміту овертайму
            </p>
          ) : null}
        </div>
      </div>

      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <ShiftDayGrid
          shifts={shifts}
          onToggle={(dayIndex) => setShifts(toggledShifts(shifts, dayIndex))}
          onTimeChange={changeTime}
        />
        <div className="flex items-center gap-3 pt-2">
          <Button variant="secondary" size="md" type="submit" disabled={saving || isOvertime}>
            {saving
              ? 'Збереження...'
              : isOvertime
                ? 'Блоковано (Овертайм)'
                : 'Зберегти захищений графік'}
          </Button>
          {successMsg ? (
            <span className="text-semantic-success text-caption font-medium">{successMsg}</span>
          ) : null}
          {errorMsg ? (
            <span role="alert" className="text-semantic-danger text-caption font-medium">
              {errorMsg}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
