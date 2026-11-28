import { Pressable, Text, View } from 'react-native';
import type { BarberDto } from '../../../lib/api/barbers';
import { styles } from '../../index.styles';

interface BookingBarberStepProps {
  barbers: BarberDto[];
  onAny: () => void;
  onSelect: (barber: BarberDto) => void;
}

export function BookingBarberStep({ barbers, onAny, onSelect }: BookingBarberStepProps) {
  return (
    <View style={styles.step}>
      <Text style={styles.cardMuted}>Оберіть майстра</Text>
      <Pressable accessibilityRole="button" style={styles.card} onPress={onAny}>
        <Text style={styles.cardTitle}>Будь-який майстер</Text>
      </Pressable>
      {barbers.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          style={styles.card}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.cardTitle}>{item.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}
