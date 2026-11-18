import { Pressable, ScrollView, Text, View } from 'react-native';
import { MONTH_NAMES, daysInMonth } from './birthday';
import { styles } from './birthday-styles';

/** Два горизонтальні ряди чипів — день (за обраним місяцем) і місяць (T-4730c). */
export function BirthdayPicker({
  day,
  month,
  onDay,
  onMonth,
}: {
  day: number;
  month: number;
  onDay: (value: number) => void;
  onMonth: (value: number) => void;
}) {
  const monthDays = month > 0 ? daysInMonth(month) : 31;
  return (
    <View>
      <Text style={styles.pickerLabel}>День</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {Array.from({ length: monthDays }, (_, i) => i + 1).map((d) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityState={{ selected: d === day }}
            accessibilityLabel={`День ${d}`}
            testID={`birth-day-${d}`}
            onPress={() => onDay(d)}
            style={[styles.chip, d === day && styles.chipSelected]}
          >
            <Text style={[styles.chipLabel, d === day && styles.chipLabelSelected]}>{d}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.pickerLabel}>Місяць</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {MONTH_NAMES.map((name, i) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityState={{ selected: i + 1 === month }}
            accessibilityLabel={name}
            testID={`birth-month-${i + 1}`}
            onPress={() => onMonth(i + 1)}
            style={[styles.chip, i + 1 === month && styles.chipSelected]}
          >
            <Text style={[styles.chipLabel, i + 1 === month && styles.chipLabelSelected]}>
              {name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
