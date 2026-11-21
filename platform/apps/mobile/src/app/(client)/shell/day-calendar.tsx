import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MobileCard, MobileEmptyState } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ExtendedAppointment } from '../../../lib/booking-contract';

export default function DayCalendar({
  date,
  appointments,
}: {
  date: string;
  appointments: ExtendedAppointment[];
}) {
  const router = useRouter();
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>{date}</Text>
      {appointments.length === 0 ? <MobileEmptyState message="На цей день записів немає" /> : null}
      {appointments.map((appointment) => (
        <Pressable
          key={appointment.id}
          accessibilityRole="button"
          onPress={() => router.push(`/(client)/appointment/${appointment.id}`)}
          style={wipStyles.row}
        >
          <View style={wipStyles.rowBody}>
            <Text style={wipStyles.subtitle}>{appointment.serviceName}</Text>
            <Text style={wipStyles.muted}>
              {appointment.startTime} — {appointment.endTime} · {appointment.barberName}
            </Text>
          </View>
          <Text style={wipStyles.cardMuted}>Деталі →</Text>
        </Pressable>
      ))}
    </MobileCard>
  );
}
