import { Pressable, Text, View } from 'react-native';
import type { BookingServiceDto, BookingSlotDto } from '../../../lib/api/booking';
import type { BarberDto } from '../../../lib/api/barbers';
import { styles } from '../../index.styles';

interface BookingConfirmStepProps {
  service: BookingServiceDto;
  slot: BookingSlotDto;
  date: string;
  barber: BarberDto | null;
  loading: boolean;
  onConfirm: () => void;
}

export function BookingConfirmStep({
  service,
  slot,
  date,
  barber,
  loading,
  onConfirm,
}: BookingConfirmStepProps) {
  return (
    <View style={styles.step}>
      <Text style={styles.cardTitle}>{service.name}</Text>
      <Text style={styles.cardMuted}>
        {date} · {slot.start}–{slot.end} · {barber?.name ?? 'будь-який майстер'}
      </Text>
      <Text style={styles.cardTitle}>{service.price} ₴</Text>
      <Text style={styles.cardMuted}>Депозит 30% спишеться карткою; решту — у студії.</Text>
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        style={[styles.cta, loading ? styles.ctaDisabled : null]}
        onPress={onConfirm}
      >
        <Text style={styles.ctaLabel}>{loading ? 'Створюємо…' : 'Підтвердити запис'}</Text>
      </Pressable>
    </View>
  );
}
