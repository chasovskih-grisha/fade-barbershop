import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchLocations, LocationDto } from '../../../../lib/api/locations';
import { LocationChairLine } from '../../../../components/LocationChairLine';
import { LocationMapPin } from '../../../../components/LocationMapPin';
import { LocationGallery } from '../../../../components/LocationGallery';
import { styles } from '../../../index.styles';

export default function LocationScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchLocations()
      .then((locs) => {
        if (!mounted) return;
        const found = locs.find((l) => l.code === code);
        if (found) {
          setLocation(found);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [code]);

  if (loading) {
    return (
      <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text testID="loading-skeleton" style={styles.cardMuted}>
          Завантаження...
        </Text>
      </View>
    );
  }

  if (error || !location) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hero}>Студію не знайдено</Text>
        <Text style={styles.cardMuted}>Локацію з кодом {code} не знайдено в системі.</Text>
        <Pressable accessibilityRole="button" style={styles.cta} onPress={() => router.push('/')}>
          <Text style={styles.ctaLabel}>До списку локацій</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable
        accessibilityRole="button"
        style={{ marginBottom: 16 }}
        onPress={() => router.push('/')}
      >
        <Text style={styles.cardMuted}>← Назад до списку</Text>
      </Pressable>

      <Text style={styles.hero} testID="studio-name">
        {location.name}
      </Text>
      <Text style={styles.heroSub} testID="studio-address" selectable>
        {location.address}
      </Text>
      <LocationMapPin address={location.address} lat={location.lat} lng={location.lng} />
      <LocationChairLine chairs={location.chairs} />
      <LocationGallery photos={location.photos} />

      <View style={{ marginTop: 24 }}>
        <Pressable
          accessibilityRole="button"
          style={styles.cta}
          onPress={() =>
            router.push({ pathname: '/(client)/booking', params: { locationCode: location.code } })
          }
        >
          <Text style={styles.ctaLabel}>Записатися</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
