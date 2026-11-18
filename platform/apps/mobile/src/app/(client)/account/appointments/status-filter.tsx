import { Pressable, Text, View } from 'react-native';
import type { CabinetStatus } from '../../../../lib/booking-contract';
import { styles } from './status-filter-styles';

export type StatusFilter = 'all' | CabinetStatus;

/**
 * Status filter chips for the mobile appointments list (REF cabinet).
 * Mirrors the web cabinet's `VisitListControls` select, but as chips —
 * the natural mobile pattern for 5 options.
 */
const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Усі' },
  { value: 'upcoming', label: 'Очікується' },
  { value: 'confirmed', label: 'Підтверджено' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Скасовано' },
];

export function StatusFilterChips({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (next: StatusFilter) => void;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist" aria-label="Фільтр статусу">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Статус: ${option.label}`}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
