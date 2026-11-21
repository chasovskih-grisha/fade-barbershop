import { Text, View } from 'react-native';
import { MobileCard, MobileEmptyState } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ExtendedAppointment } from '../../../lib/booking-contract';

export default function ClientVisits({ visits }: { visits: ExtendedAppointment[] }) {
  if (visits.length === 0) {
    return <MobileEmptyState message="У цього клієнта немає візитів" />;
  }
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Візити ({visits.length})</Text>
      {visits.map((visit) => (
        <View key={visit.id} style={wipStyles.row}>
          <View style={wipStyles.rowBody}>
            <Text style={wipStyles.subtitle}>{visit.serviceName}</Text>
            <Text style={wipStyles.muted}>
              {visit.date} · {visit.startTime} · {visit.barberName}
            </Text>
          </View>
          <Text style={wipStyles.cardMuted}>{visit.status}</Text>
        </View>
      ))}
    </MobileCard>
  );
}
