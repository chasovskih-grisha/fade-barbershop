import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './index.styles';
import { LocationDto } from '../lib/api/locations';
import { ServiceDto } from '../lib/api/catalog';
import { LocationChairLine } from '../components/LocationChairLine';

export function IndexHome({
  loading,
  stale,
  locations,
  services,
}: {
  loading: boolean;
  stale: boolean;
  locations: LocationDto[];
  services: ServiceDto[];
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

      {loading ? (
        <View testID="loading-skeleton" style={{ padding: 20 }}>
          <Text style={styles.cardMuted}>Завантаження...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Локації</Text>
          {locations.map((loc) => (
            <Pressable
              key={loc.id}
              accessibilityRole="button"
              accessibilityLabel={loc.name}
              testID={`location-card-${loc.code}`}
              style={styles.row}
              onPress={() => router.push(`/(client)/locations/${loc.code}`)}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{loc.name}</Text>
                <Text style={styles.cardMuted}>{loc.address}</Text>
                <LocationChairLine chairs={loc.chairs} />
              </View>
            </Pressable>
          ))}

          <Text style={styles.sectionTitle}>Послуги</Text>
          {services.map((srv) => (
            <View key={srv.id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{srv.name}</Text>
                <Text style={styles.cardMuted}>{srv.durationMinutes} хв</Text>
              </View>
              <Text style={styles.rowPrice}>{srv.price} ₴</Text>
            </View>
          ))}
        </>
      )}

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
