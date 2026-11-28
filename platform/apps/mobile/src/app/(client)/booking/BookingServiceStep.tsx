import { Pressable, Text, View } from 'react-native';
import type { BookingServiceDto } from '../../../lib/api/booking';
import { styles } from '../../index.styles';

interface BookingServiceStepProps {
  services: BookingServiceDto[];
  loading: boolean;
  onSelect: (service: BookingServiceDto) => void;
}

export function BookingServiceStep({ services, loading, onSelect }: BookingServiceStepProps) {
  return (
    <View style={styles.step}>
      <Text style={styles.cardMuted}>Оберіть послугу</Text>
      {services.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          style={styles.card}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardMuted}>
            {item.duration} хв · {item.price} ₴
          </Text>
        </Pressable>
      ))}
      {!loading && services.length === 0 ? (
        <Text style={styles.cardMuted}>Немає доступних послуг</Text>
      ) : null}
    </View>
  );
}
