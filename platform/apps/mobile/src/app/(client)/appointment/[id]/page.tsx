import { ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { wipStyles } from '../../../wip-styles';
import AppointmentDetailBody from './appointment-detail-body';
import { useAppointmentDetail } from './use-appointment-detail';

export default function AppointmentDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');
  const { appointment, reference, loading, failed, reload } = useAppointmentDetail(id);

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
        <AppointmentDetailBody
          id={id}
          appointment={appointment}
          reference={reference}
          loading={loading}
          failed={failed}
          onReload={reload}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
