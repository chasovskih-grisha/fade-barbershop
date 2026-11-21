import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MobileButton, MobileEmptyState, MobileSkeleton } from '../../../../ui/kit';
import { wipStyles } from '../../../wip-styles';
import AppointmentDetailCard from './AppointmentDetailCard';
import AppointmentReferenceCard from './AppointmentReferenceCard';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import type { AppointmentReference } from './appointment-reference-api';

export default function AppointmentDetailBody({
  id,
  appointment,
  reference,
  loading,
  failed,
  onReload,
}: {
  id: string;
  appointment: ExtendedAppointment | null;
  reference: AppointmentReference | null;
  loading: boolean;
  failed: boolean;
  onReload: () => void;
}) {
  const router = useRouter();
  return (
    <>
      <TouchableOpacity accessibilityRole="button" onPress={() => router.back()}>
        <Text style={wipStyles.muted}>← Назад</Text>
      </TouchableOpacity>
      <View style={wipStyles.header}>
        <Text style={wipStyles.title}>ВІЗИТ #{id.slice(-6)}</Text>
        <Text style={wipStyles.subtitle}>Деталі візиту та AI-референс</Text>
      </View>
      {loading ? <MobileSkeleton /> : null}
      {failed ? (
        <View style={wipStyles.banner}>
          <Text style={wipStyles.bannerText}>Не вдалося завантажити візит</Text>
          <MobileButton title="Перезавантажити" onPress={onReload} />
        </View>
      ) : null}
      {!loading && !failed && !appointment ? (
        <MobileEmptyState message="Візит не знайдено" />
      ) : null}
      {!loading && !failed && appointment ? (
        <>
          <AppointmentDetailCard appointment={appointment} />
          <AppointmentReferenceCard reference={reference} />
        </>
      ) : null}
    </>
  );
}
