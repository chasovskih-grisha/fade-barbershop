import { Pressable, Text, TextInput, View } from 'react-native';
import { isBookableDate } from '../../../lib/booking-date';
import { todayInKyiv, type BookingSlotDto } from '../../../lib/api/booking';
import { styles } from '../../index.styles';

interface BookingSlotStepProps {
  date: string;
  dateError: string | null;
  slots: BookingSlotDto[];
  loading: boolean;
  onChangeDate: (value: string) => void;
  onLoad: () => void;
  onSelect: (slot: BookingSlotDto) => void;
}

export function BookingSlotStep({
  date,
  dateError,
  slots,
  loading,
  onChangeDate,
  onLoad,
  onSelect,
}: BookingSlotStepProps) {
  const validDate = isBookableDate(date, todayInKyiv());
  return (
    <View style={styles.step}>
      <Text style={styles.cardMuted}>Дата (рррр-мм-дд)</Text>
      <TextInput
        value={date}
        onChangeText={onChangeDate}
        onEndEditing={onLoad}
        autoCapitalize="none"
        style={styles.loginInput}
      />
      {dateError ? <Text style={styles.cardMuted}>{dateError}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={!validDate}
        style={[styles.cta, !validDate ? styles.ctaDisabled : null]}
        onPress={onLoad}
      >
        <Text style={styles.ctaLabel}>Показати слоти</Text>
      </Pressable>
      {loading ? <Text style={styles.cardMuted}>Шукаємо вільний час...</Text> : null}
      {slots.map((item) => (
        <Pressable
          key={item.start}
          accessibilityRole="button"
          disabled={item.barbers.length === 0}
          style={[styles.card, item.barbers.length === 0 ? styles.ctaDisabled : null]}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.cardTitle}>
            {item.start}–{item.end}
          </Text>
        </Pressable>
      ))}
      {!loading && slots.length === 0 ? (
        <Text style={styles.cardMuted}>На цю дату вільного часу немає</Text>
      ) : null}
    </View>
  );
}
