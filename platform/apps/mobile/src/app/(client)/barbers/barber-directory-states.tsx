import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@fade/design-tokens';
import { styles } from '../../index.styles';

// T-4868: три rізні стани довідника майстрів не можуть виглядати однаково.
// Завантаження — портретні скелети тієї ж форми, що й картки; порожній payload —
// одне речення; збій запиту — речення про помилку й повтор, а не «майстрів
// немає» (це сказало б гостеві, що в студії нікого немає).

const COLOR = tokens.color;
const RADIUS = tokens.radius;

const skeleton = StyleSheet.create({
  card: {
    backgroundColor: COLOR.surface.raised.value,
    borderRadius: RADIUS.card.value,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  portrait: {
    backgroundColor: COLOR.surface.sunken.value,
    borderRadius: RADIUS.card.value,
    height: 160,
  },
  line: { backgroundColor: COLOR.surface.sunken.value, borderRadius: 6, height: 14 },
  lineShort: { width: '40%' },
  lineLong: { width: '70%' },
});

export function BarberDirectorySkeleton({ items = 3 }: { items?: number }) {
  return (
    <View testID="loading-skeleton">
      {Array.from({ length: items }, (_, index) => (
        <View key={index} testID="barber-skeleton-card" style={skeleton.card}>
          <View style={skeleton.portrait} />
          <View style={[skeleton.line, skeleton.lineLong]} />
          <View style={[skeleton.line, skeleton.lineShort]} />
        </View>
      ))}
    </View>
  );
}

export function BarberDirectoryError({ onRetry }: { onRetry: () => void }) {
  return (
    <View>
      <Text style={styles.hero} testID="barbers-error">
        Не вдалося завантажити майстрів
      </Text>
      <Pressable
        accessibilityRole="button"
        style={styles.cta}
        testID="barbers-retry"
        onPress={onRetry}
      >
        <Text style={styles.ctaLabel}>Спробувати ще раз</Text>
      </Pressable>
    </View>
  );
}

export function BarberDirectoryEmpty() {
  return (
    <Text style={styles.cardMuted} testID="no-barbers">
      Майстрів наразі немає
    </Text>
  );
}
