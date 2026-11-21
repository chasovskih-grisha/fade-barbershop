import { Text, View } from 'react-native';
import { MobileCard } from '../../../../ui/kit';
import { wipStyles } from '../../../wip-styles';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';

export default function AppointmentDetailCard({
  appointment,
}: {
  appointment: ExtendedAppointment;
}) {
  const rows = [
    ['Барбер', appointment.barberName],
    ['Сервіс', appointment.serviceName],
    ['Локація', appointment.locationName],
    ['Дата', appointment.date],
    ['Час', `${appointment.startTime} — ${appointment.endTime}`],
  ];
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Деталі візиту</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={wipStyles.row}>
          <Text style={wipStyles.muted}>{label}</Text>
          <Text style={wipStyles.subtitle}>{value || '—'}</Text>
        </View>
      ))}
    </MobileCard>
  );
}
