import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MobileButton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ExtendedAppointment } from '../../../lib/booking-contract';
import CalendarToggle, { type CalendarMode } from './calendar-toggle';
import ShellDataState from './shell-data-state';

export default function ShellBody({
  date,
  mode,
  appointments,
  loading,
  failed,
  onMode,
}: {
  date: string;
  mode: CalendarMode;
  appointments: ExtendedAppointment[];
  loading: boolean;
  failed: boolean;
  onMode: (mode: CalendarMode) => void;
}) {
  const router = useRouter();
  return (
    <>
      <Text style={wipStyles.title}>МІЙ КАЛЕНДАР</Text>
      <Text style={wipStyles.subtitle}>{date}</Text>
      <CalendarToggle mode={mode} onChange={onMode} />
      <ShellDataState
        date={date}
        mode={mode}
        appointments={appointments}
        loading={loading}
        failed={failed}
      />
      {!loading && !failed && appointments.length === 0 ? (
        <MobileButton title="Записатися" onPress={() => router.push('/(client)/booking')} />
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.push('/(client)/booking')}
        style={wipStyles.fab}
      >
        <Text style={wipStyles.fabLabel}>+</Text>
      </TouchableOpacity>
    </>
  );
}
