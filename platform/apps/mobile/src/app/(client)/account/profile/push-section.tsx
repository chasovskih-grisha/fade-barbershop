import { Text, View } from 'react-native';
import { usePush } from '@/lib/notifications';
import { styles } from './profile-styles';

/** Блок сповіщень профілю (T-4426): токен, статус, увімкнення/вимкнення. */
export function PushSection() {
  const { token, permission, allowed, register, revoke, error } = usePush();
  return (
    <View style={styles.card}>
      {error ? (
        <View style={styles.alert}>
          <Text style={styles.alertText}>{error}</Text>
        </View>
      ) : null}
      <Text style={styles.label}>Сповіщення</Text>
      <View style={styles.tokenRow}>
        <Text style={styles.tokenMuted}>Expo push-токен</Text>
        <Text style={styles.token} numberOfLines={1}>
          {token ?? '—'}
        </Text>
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Статус</Text>
        <Text style={[styles.statusBadge, allowed ? styles.statusAllowed : styles.statusDenied]}>
          {allowed ? `Увімкнено${permission?.ios?.status === 1 ? ' (тимчасово)' : ''}` : 'Вимкнено'}
        </Text>
      </View>
      {allowed ? (
        <Text style={styles.dangerButton} onPress={() => void revoke()}>
          Вийти і відключити сповіщення
        </Text>
      ) : (
        <Text style={styles.primaryButton} onPress={() => void register()}>
          Увімкнути сповіщення
        </Text>
      )}
      <Text style={styles.hint}>
        Сповіщення допоможуть отримувати нагадування про візити і нові записи.
      </Text>
    </View>
  );
}
