import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { styles } from '../../../index.styles';

// Стани екрану майстра: окремий модуль, щоб основний екран лишався
// у межах ADR 0019 і містив тільки завантаження даних та контент.

export function BarberLoadingState() {
  return (
    <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text testID="loading-skeleton" style={styles.cardMuted}>
        Завантаження...
      </Text>
    </View>
  );
}

export function BarberNotFoundState({ slug, onBack }: { slug: string; onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.hero}>Майстра не знайдено</Text>
      <Text style={styles.cardMuted}>Барбера з ідентифікатором {slug} не знайдено в системі.</Text>
      <Pressable accessibilityRole="button" style={styles.cta} onPress={onBack}>
        <Text style={styles.ctaLabel}>До каталогу майстрів</Text>
      </Pressable>
    </ScrollView>
  );
}

// T-4865b: прямий лінк може пережити роботу майстра — екран каже імʼя й
// причину, веде назад до довідника і не пропонує запис.
export function BarberInactiveState({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.hero} testID="barber-inactive">
        {name} зараз не приймає записів
      </Text>
      <Text style={styles.cardMuted}>
        Майстер більше не працює в студії, тож записатися до нього не можна. Оберіть іншого
        майстра в довіднику.
      </Text>
      <Pressable accessibilityRole="button" style={styles.cta} onPress={onBack}>
        <Text style={styles.ctaLabel}>До каталогу майстрів</Text>
      </Pressable>
    </ScrollView>
  );
}
