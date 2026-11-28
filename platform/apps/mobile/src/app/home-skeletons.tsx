// Скелети стартових секцій (T-4846): картка студії і рядок послуги тієї ж
// форми, що й завантажений вміст, тож екран не «стрибає», коли приходять дані.
// Текст «Завантаження...» більше не є станом завантаження.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@fade/design-tokens';

const COLOR = tokens.color;
const RADIUS = tokens.radius;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLOR.surface.raised.value,
    borderRadius: RADIUS.card.value,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  line: { backgroundColor: COLOR.surface.sunken.value, borderRadius: 6, height: 14 },
  lineShort: { width: '45%' },
  lineLong: { width: '80%' },
  photo: { backgroundColor: COLOR.surface.sunken.value, borderRadius: RADIUS.card.value, height: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.surface.sunken.value,
    borderRadius: RADIUS.card.value,
    padding: 16,
    gap: 12,
  },
  rowBody: { flex: 1, gap: 8 },
  rowsGap: { gap: 12 },
});

export function HomeCardsSkeleton({ items = 3 }: { items?: number }) {
  return (
    <View testID="home-cards-skeleton">
      {Array.from({ length: items }, (_, index) => (
        <View key={index} testID="home-cards-skeleton-card" style={styles.card}>
          <View style={[styles.line, styles.lineShort]} />
          <View style={styles.photo} />
          <View style={[styles.line, styles.lineLong]} />
        </View>
      ))}
    </View>
  );
}

export function HomeRowsSkeleton({ items = 3 }: { items?: number }) {
  return (
    <View testID="home-rows-skeleton" style={styles.rowsGap}>
      {Array.from({ length: items }, (_, index) => (
        <View key={index} testID="home-rows-skeleton-row" style={styles.row}>
          <View style={styles.rowBody}>
            <View style={[styles.line, styles.lineShort]} />
            <View style={[styles.line, styles.lineLong]} />
          </View>
          <View style={[styles.line, styles.lineShort]} />
        </View>
      ))}
    </View>
  );
}
