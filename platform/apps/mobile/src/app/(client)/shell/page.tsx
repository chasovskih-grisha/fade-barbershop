import { useEffect, useState } from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wipStyles } from '../../wip-styles';
import { getAppointments } from '../../../lib/api/appointments';
import type { ExtendedAppointment } from '../../../lib/booking-contract';
import ShellBody from './shell-body';
import type { CalendarMode } from './calendar-toggle';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ClientShellScreen() {
  const [mode, setMode] = useState<CalendarMode>('week');
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const date = today();

  useEffect(() => {
    let mounted = true;
    getAppointments()
      .then((list) => {
        if (mounted) setAppointments(list);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
        <ShellBody
          date={date}
          mode={mode}
          appointments={appointments}
          loading={loading}
          failed={failed}
          onMode={setMode}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
