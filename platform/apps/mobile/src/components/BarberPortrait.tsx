import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@fade/design-tokens';
import type { BarberPhotoDto } from '../lib/api/barbers';

// T-4871b: обличчя на телефоні — це вся картка, тому жодного градієнта чи
// накладки поверх фото. Фото береться з payload (T-4869), без фото —
// ініціали. Картка списку тримає фіксований кадр, щоб велике фото не
// розтягувало список; повне зображення чекає на екрані майстра.

const COLOR = tokens.color;

export function BarberPortrait({
  name,
  photo,
  variant = 'card',
}: {
  name: string;
  photo?: BarberPhotoDto | null | undefined;
  variant?: 'card' | 'screen';
}) {
  const initials = name.trim().slice(0, 1).toUpperCase();

  return (
    <View
      testID={`barber-portrait-${variant}`}
      style={variant === 'screen' ? styles.screenFrame : styles.cardFrame}
    >
      {photo?.url ? (
        <Image
          testID="barber-portrait-photo"
          source={{ uri: photo.url }}
          accessibilityLabel={photo.alt || name}
          resizeMode="cover"
          style={styles.photo}
        />
      ) : (
        <Text testID="barber-portrait-initials" style={styles.initials}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardFrame: {
    width: 64,
    aspectRatio: 4 / 5,
    borderRadius: tokens.radius.card.value,
    overflow: 'hidden',
    backgroundColor: COLOR.surface.sunken.value,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: tokens.radius.card.value,
    overflow: 'hidden',
    backgroundColor: COLOR.surface.sunken.value,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  initials: {
    color: COLOR.text.muted.value,
    fontSize: tokens.typography.fontSize.h3.value,
    fontWeight: '700',
  },
});
