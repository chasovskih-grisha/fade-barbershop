import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './index.styles';
import { LocationDto } from '../lib/api/locations';
import { ServiceDto } from '../lib/api/catalog';
import type { StartupSection } from '../lib/use-startup-data';
import { LocationsSection, ServicesSection } from './home-sections';

// T-4846: у кожної секції три стани — скелет, порожній рядок, помилка з
// повтором. Помилка локацій не ховає послуги, які завантажились, і навпаки:
// секції приходять незалежно.

export function IndexHome({
  stale,
  locations,
  services,
  pushError = null,
  onEnablePush,
  onRetryLocations,
  onRetryServices,
}: {
  stale: boolean;
  locations: StartupSection<LocationDto[]>;
  services: StartupSection<ServiceDto[]>;
  /** Стан push-каналу з хука реєстрації (T-070): відмова в дозволі не ховається. */
  pushError?: string | null;
  onEnablePush?: () => void;
  onRetryLocations?: () => void;
  onRetryServices?: () => void;
}) {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View accessibilityLabel="FADE" testID="brand-lockup">
        <Text style={styles.brand}>FADE</Text>
      </View>
      <Text style={styles.hero} testID="home-hero">
        Мережа чоловічих перукарень FADE
      </Text>
      <Text style={styles.heroSub}>Оберіть студію нижче, щоб записатися</Text>

      {stale ? (
        <View testID="offline-banner" style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Офлайн: показано збережені дані. Оновляться, коли відновиться мережа.
          </Text>
        </View>
      ) : null}

      {pushError ? (
        <View testID="push-permission-notice" style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{pushError}</Text>
          {onEnablePush ? (
            <Pressable accessibilityRole="button" onPress={onEnablePush}>
              <Text style={styles.ctaLabel}>Увімкнути сповіщення</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Локації</Text>
      <LocationsSection section={locations} onRetry={onRetryLocations} />

      <Text style={styles.sectionTitle}>Послуги</Text>
      <ServicesSection section={services} onRetry={onRetryServices} />

      <View style={styles.navAnchor}>
        <Text style={styles.sectionTitle}>Довідка</Text>
        <Pressable
          accessibilityRole="button"
          style={[styles.cta, styles.navCta]}
          onPress={() => router.push('/(client)/account/devices')}
        >
          <Text style={styles.ctaLabel}>Пристрої</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
