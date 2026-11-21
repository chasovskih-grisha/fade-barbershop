import type { ExtendedAppointment } from '../../../lib/booking-contract';
import type { CalendarMode } from './calendar-toggle';
import DayCalendar from './day-calendar';
import WeekCalendar from './week-calendar';

export default function ShellCalendarContent({
  date,
  mode,
  appointments,
}: {
  date: string;
  mode: CalendarMode;
  appointments: ExtendedAppointment[];
}) {
  if (mode === 'day') {
    return (
      <DayCalendar date={date} appointments={appointments.filter((item) => item.date === date)} />
    );
  }
  return <WeekCalendar appointments={appointments} />;
}
