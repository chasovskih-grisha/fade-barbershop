import { Text } from 'react-native';
import { MobileSkeleton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ExtendedAppointment } from '../../../lib/booking-contract';
import type { CalendarMode } from './calendar-toggle';
import ShellCalendarContent from './shell-calendar-content';

export default function ShellDataState({
  date,
  mode,
  appointments,
  loading,
  failed,
}: {
  date: string;
  mode: CalendarMode;
  appointments: ExtendedAppointment[];
  loading: boolean;
  failed: boolean;
}) {
  if (loading) return <MobileSkeleton />;
  if (failed) return <Text style={wipStyles.muted}>Не вдалося завантажити візити</Text>;
  return <ShellCalendarContent date={date} mode={mode} appointments={appointments} />;
}
