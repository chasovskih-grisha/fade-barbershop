export interface ShiftSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOvertime?: boolean;
}

export interface StaffScheduleOvertimeGuardProps {
  barberId: string;
  barberName: string;
  maxWeeklyHours?: number;
  initialShifts?: ShiftSlot[];
  onSaveSchedule: (shifts: ShiftSlot[]) => Promise<boolean>;
  saving?: boolean;
}

export const DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'];

export const DEFAULT_SHIFTS: ShiftSlot[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: '09:00',
  endTime: '18:00',
}));

export function totalHours(shifts: ShiftSlot[]): number {
  return shifts.reduce((sum, shift) => {
    const [startH = 0, startM = 0] = shift.startTime.split(':').map(Number);
    const [endH = 0, endM = 0] = shift.endTime.split(':').map(Number);
    const hours = endH + endM / 60 - (startH + startM / 60);
    return sum + (Number.isNaN(hours) || hours < 0 ? 0 : hours);
  }, 0);
}

export interface ShiftTimeEdit {
  shifts: ShiftSlot[];
  index: number;
  field: 'startTime' | 'endTime';
  value: string;
}

export function updatedShift({ shifts, index, field, value }: ShiftTimeEdit): ShiftSlot[] {
  return shifts.map((shift, position) =>
    position === index ? { ...shift, [field]: value } : shift
  );
}

export function toggledShifts(shifts: ShiftSlot[], dayIndex: number): ShiftSlot[] {
  const exists = shifts.some((shift) => shift.dayOfWeek === dayIndex);
  const next = exists
    ? shifts.filter((shift) => shift.dayOfWeek !== dayIndex)
    : [...shifts, { dayOfWeek: dayIndex, startTime: '09:00', endTime: '17:00' }];
  return next.sort((left, right) => left.dayOfWeek - right.dayOfWeek);
}
