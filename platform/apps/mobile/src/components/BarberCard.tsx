import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@fade/design-tokens';
import type { BarberDto } from '../lib/api/barbers';
import { BarberPortrait } from './BarberPortrait';

// T-4851b: те саме правило, що на сайті (T-4851a) — картка каже лише те, що
// знає payload: імʼя, студія, досвід і спеціалізації, коли вони прийшли.
// Жодних «Вільні вікна», рангів чи дефолтних років; картка з самим імʼям
// лишається валідною.

export function BarberCard({ barber, onPress }: { barber: BarberDto; onPress: () => void }) {
  const specialties = barber.specialties ?? [];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={barber.name}
      testID={`barber-card-${barber.id}`}
      style={styles.card}
      onPress={onPress}
    >
      <BarberPortrait name={barber.name} photo={barber.photo} />
      <View style={styles.body}>
        <Text style={styles.name}>{barber.name}</Text>
        {barber.experience ? <Text style={styles.muted}>{barber.experience}</Text> : null}
        {barber.locationName ? <Text style={styles.muted}>{barber.locationName}</Text> : null}
        {specialties.length > 0 ? (
          <View style={styles.chips}>
            {specialties.map((specialty) => (
              <Text key={specialty} testID={`barber-chip-${specialty}`} style={styles.chip}>
                {specialty}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: tokens.color.surface.sunken.value,
    borderRadius: tokens.radius.card.value,
    padding: 12,
  },
  body: { flex: 1, gap: 2 },
  name: {
    color: tokens.color.text.primary.value,
    fontSize: tokens.typography.fontSize.bodyLg.value,
    fontWeight: '600',
  },
  muted: {
    color: tokens.color.text.muted.value,
    fontSize: tokens.typography.fontSize.caption.value,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    color: tokens.color.text.secondary.value,
    fontSize: tokens.typography.fontSize.caption.value,
    backgroundColor: tokens.color.surface.raised.value,
    borderRadius: tokens.radius.card.value,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
