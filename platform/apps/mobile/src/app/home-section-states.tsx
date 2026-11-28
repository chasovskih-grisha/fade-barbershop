// Копірайт і блок помилки стартових секцій головної (T-4846). Помилка секції —
// це речення про саму секцію плюс повтор, а не порожній список: падіння запиту
// не має виглядати як «студій немає».
import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { styles } from './index.styles';

export const LOCATIONS_FAILED = 'Не вдалося завантажити студії.';
export const SERVICES_FAILED = 'Не вдалося завантажити послуги.';
export const LOCATIONS_EMPTY = 'Студій поки немає.';
export const SERVICES_EMPTY = 'Послуг поки немає.';

export function SectionError({
  text,
  testID,
  onRetry,
}: {
  text: string;
  testID: string;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <View testID={testID} style={styles.offlineBanner}>
      <Text style={styles.errorText}>{text}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} testID={`${testID}-retry`}>
          <Text style={styles.ctaLabel}>Спробувати ще раз</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
