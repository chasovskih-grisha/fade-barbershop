import { Text, View } from 'react-native';
import { MobileCard } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import type { ExtendedAppointment } from '../../../lib/booking-contract';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function WeekCalendar({ appointments }: { appointments: ExtendedAppointment[] }) {
  const counts = DAYS.map(
    (_, index) =>
      appointments.filter((appointment) => new Date(appointment.date).getDay() === (index + 1) % 7)
        .length
  );
  return (
    <MobileCard>
      <Text style={wipStyles.cardTitle}>Тиждень</Text>
      <View style={wipStyles.tabs}>
        {DAYS.map((day, index) => (
          <View key={day} style={wipStyles.tab}>
            <Text style={wipStyles.tabLabel}>{day}</Text>
            <Text style={wipStyles.muted}>{counts[index] ?? 0}</Text>
          </View>
        ))}
      </View>
      <Text style={wipStyles.cardMuted}>Натисніть «День», щоб побачити деталі.</Text>
    </MobileCard>
  );
}
