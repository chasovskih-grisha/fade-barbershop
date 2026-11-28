import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchBarbersByStudio, type StudioRoster } from '../../../lib/api/studio-roster';
import { styles } from '../../index.styles';
import { barberHref, homeHref } from '../../../lib/routes';
import { BarberDirectoryError, BarberDirectorySkeleton } from './barber-directory-states';
import { BarberStudioGroups } from './barber-studio-groups';

export default function BarbersDirectoryScreen() {
  const router = useRouter();
  const [studios, setStudios] = useState<StudioRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // T-4868: повтор — це новий прогін того самого завантаження, а не вихід на
  // головну: збій мережі не має відбирати в гостя довідник.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    // T-4852b: довідник групує студії так само, як сайт (T-4852a).
    fetchBarbersByStudio()
      .then((rosters) => {
        if (mounted) setStudios(rosters);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hero} testID="directory-title">
          Наші майстри
        </Text>
        <BarberDirectorySkeleton />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hero} testID="directory-title">
          Наші майстри
        </Text>
        <BarberDirectoryError onRetry={retry} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable
        accessibilityRole="button"
        style={{ marginBottom: 16 }}
        onPress={() => router.push(homeHref())}
      >
        <Text style={styles.cardMuted} testID="back-home">
          ← На головну
        </Text>
      </Pressable>

      <Text style={styles.hero} testID="directory-title">
        Наші майстри
      </Text>
      <Text style={styles.heroSub}>Оберіть барбера для запису</Text>

      <BarberStudioGroups studios={studios} onOpen={(id) => router.push(barberHref(id))} />
    </ScrollView>
  );
}
