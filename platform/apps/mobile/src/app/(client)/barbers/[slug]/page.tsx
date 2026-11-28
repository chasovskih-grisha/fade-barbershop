import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchLocations } from '../../../../lib/api/locations';
import { fetchBarberById, BarberDto } from '../../../../lib/api/barbers';
import { BarberPortrait } from '../../../../components/BarberPortrait';
import { BarberInactiveState, BarberLoadingState, BarberNotFoundState } from './barber-screen-states';
import { styles } from '../../../index.styles';
import { barbersHref, bookingHref } from '../../../../lib/routes';
import { shareBarberProfile } from '../../../../lib/share';

export default function BarberScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [barber, setBarber] = useState<BarberDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchLocations()
      .then(async (locs) => {
        if (!mounted) return;
        const activeLoc = locs.find((l) => l.active) || locs[0];
        if (!activeLoc) {
          if (mounted) setError(true);
          return;
        }
        const found = await fetchBarberById(activeLoc.id, slug || '');
        if (!mounted) return;
        if (found) {
          setBarber(found);
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
  }, [slug]);

  if (loading) return <BarberLoadingState />;

  if (error || !barber) {
    return (
      <BarberNotFoundState slug={slug || ''} onBack={() => router.push(barbersHref())} />
    );
  }

  if (barber.active === false) {
    return <BarberInactiveState name={barber.name} onBack={() => router.push(barbersHref())} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable
        accessibilityRole="button"
        style={{ marginBottom: 16 }}
        onPress={() => router.push(barbersHref())}
      >
        <Text style={styles.cardMuted} testID="back-button">
          ← Назад до майстрів
        </Text>
      </Pressable>

      <BarberPortrait name={barber.name} photo={barber.photo} variant="screen" />

      <Text style={styles.hero} testID="barber-name">
        {barber.name}
      </Text>
      {barber.locationName ? (
        <Text style={styles.heroSub} testID="barber-location">
          {barber.locationName}
        </Text>
      ) : null}

      <View style={{ marginTop: 24, gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          style={styles.cta}
          onPress={() =>
            router.push(bookingHref(barber.id))
          }
        >
          <Text style={styles.ctaLabel}>Записатися</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Поділитися профілем ${barber.name}`}
          testID="share-barber"
          style={styles.cta}
          onPress={() => shareBarberProfile(barber.name, slug || barber.id)}
        >
          <Text style={styles.ctaLabel}>Поділитися</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
