import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { getClientSessions } from '../../../../lib/api/client-sessions';
import { styles } from './devices.styles';

const CHANNEL_LABEL: Record<string, string> = { web: 'Вебсайт', mobile: 'Мобільний застосунок' };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('uk-UA', { dateStyle: 'long', timeStyle: 'short' });
}

export function DeviceListItem({
  session,
  current,
}: {
  session: Awaited<ReturnType<typeof getClientSessions>>[number];
  current: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{CHANNEL_LABEL[session.channel]}</Text>
        <Text style={styles.rowMuted}>Вхід: {formatDate(session.createdAt)}</Text>
      </View>
      {current ? <Text style={styles.current}>Цей пристрій</Text> : null}
    </View>
  );
}

export function RevokeConfirm({
  revoking,
  onCancel,
  onConfirm,
}: {
  revoking: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.confirmOverlay}>
      <View style={styles.confirmCard}>
        <Text style={styles.confirmTitle}>Вийти з усіх інших пристроїв?</Text>
        <Text style={styles.confirmDesc}>
          Інші пристрої одразу втратять доступ до акаунта. Цей пристрій залишиться в системі.
        </Text>
        <Text
          style={styles.confirmLink}
          onPress={() => {
            onCancel();
            router.push('/(client)/account/profile');
          }}
        >
          керувати сповіщеннями
        </Text>
        <View style={styles.confirmActions}>
          <Text style={styles.confirmCancel} onPress={onCancel} disabled={revoking}>
            Скасувати
          </Text>
          <Text
            style={[styles.confirmDanger, revoking && styles.confirmDangerLoading]}
            onPress={onConfirm}
            disabled={revoking}
          >
            {revoking ? 'Виходимо…' : 'Вийти скрізь'}
          </Text>
        </View>
      </View>
    </View>
  );
}
