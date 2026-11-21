import { useEffect, useState } from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { wipStyles } from '../../wip-styles';
import { getAppointments } from '../../../lib/api/appointments';
import type { ExtendedAppointment } from '../../../lib/booking-contract';
import BarberClientBody from './barber-client-body';
import type { ClientTab } from './client-tabs';

export default function BarberClientCardScreen() {
  const params = useLocalSearchParams<{
    barberId?: string | string[];
    clientId?: string | string[];
  }>();
  const router = useRouter();
  const rawId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;
  const clientId = rawId ?? '';
  const [tab, setTab] = useState<ClientTab>('visits');
  const [visits, setVisits] = useState<ExtendedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAppointments()
      .then((list) => {
        if (mounted) setVisits(list);
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
        <BarberClientBody
          clientId={clientId}
          tab={tab}
          visits={visits}
          loading={loading}
          failed={failed}
          onTab={setTab}
          onBook={() => router.push('/(client)/booking')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
