import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { tokens } from '@fade/design-tokens';
import type { ChairDto } from '../lib/api/locations';

// T-4830b: та сама лінія про крісла, що на сайті (T-4830a) — рахунок активних
// крісел із payload (T-4850), імʼя іменованого крісла, нуль активних — лінії
// немає. Жодного пульсу й «відчинено»: крісло не обіцяє вільне вікно.

function chairCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} крісло`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} крісла`;
  return `${count} крісел`;
}

export function LocationChairLine({ chairs }: { chairs?: ChairDto[] | null | undefined }) {
  // Старі кеші (T-4429) і старі відповіді могли прийти без `chairs` — лінія в
  // такому разі мовчить, а не падає і не вигадує «2».
  const active = (chairs ?? []).filter((chair) => chair.active);
  if (active.length === 0) return null;

  const names = active.map((chair) => chair.name).filter((name): name is string => Boolean(name));
  const label =
    names.length > 0
      ? `Крісла: ${names.slice(0, 2).join(', ')}${active.length > 2 ? ` +${active.length - 2}` : ''}`
      : chairCount(active.length);

  return (
    <Text testID="location-chair-line" style={styles.line}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: {
    color: tokens.color.text.muted.value,
    fontSize: tokens.typography.fontSize.caption.value,
  },
});
