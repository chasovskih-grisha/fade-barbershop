import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchLocations } from '../../../lib/api/locations';
import { fetchBarbers, BarberDto } from '../../../lib/api/barbers';
import { BarberCard } from '../../../components/BarberCard';
import { styles } from '../../index.styles';

export default function BarbersDirectoryScreen() {
  const router = useRouter();
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
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
        const list = await fetchBarbers(activeLoc.id);
        if (!mounted) return;
        setBarbers(list);
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
  }, []);

  if (loading) {
    return (
      <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text testID="loading-skeleton" style={styles.cardMuted}>
          Завантаження...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hero}>Не вдалося завантажити майстрів</Text>
        <Pressable accessibilityRole="button" style={styles.cta} onPress={() => router.push('/')}>
          <Text style={styles.ctaLabel}>На головну</Text>
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
        <Text style={styles.cardMuted} testID="back-home">
          ← На головну
        </Text>
      </Pressable>

      <Text style={styles.hero} testID="directory-title">
        Наші майстри
      </Text>
      <Text style={styles.heroSub}>Оберіть барбера для запису</Text>

      <View style={{ marginTop: 16 }}>
        {barbers.length === 0 ? (
          <Text style={styles.cardMuted} testID="no-barbers">
            Майстрів наразі немає
          </Text>
        ) : (
          barbers.map((b) => (
            <BarberCard
              key={b.id}
              barber={b}
              onPress={() => router.push(`/(client)/barbers/${b.id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
