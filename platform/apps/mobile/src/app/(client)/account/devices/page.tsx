import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getClientSessions, revokeAllSessions } from '../../../../lib/api/client-sessions';
import { DeviceListItem, RevokeConfirm } from './devices-ui';
import { styles } from './devices.styles';

const LOAD_FAILED = 'Не вдалося завантажити пристрої. Спробуйте пізніше.';
const REVOKE_FAILED = 'Не вдалося вийти з інших пристроїв. Спробуйте ще раз.';

type LoadingState =
  | { kind: 'loading' }
  | { kind: 'loaded'; sessions: Awaited<ReturnType<typeof getClientSessions>> }
  | { kind: 'error'; message: string };

export function DevicesScreen() {
  const [state, setState] = useState<LoadingState>({ kind: 'loading' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    setActionError(null);
    try {
      const sessions = await getClientSessions();
      setState({ kind: 'loaded', sessions });
    } catch {
      setState({ kind: 'error', message: LOAD_FAILED });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sessions = state.kind === 'loaded' ? state.sessions : [];
  const others = sessions.filter((session) => !session.current).length;

  const confirmRevokeAll = useCallback(async () => {
    setRevoking(true);
    setActionError(null);
    try {
      await revokeAllSessions();
      setConfirmOpen(false);
      await load();
    } catch {
      setActionError(REVOKE_FAILED);
    } finally {
      setRevoking(false);
    }
  }, [load]);

  return (
    <View style={styles.screen}>
      {state.kind === 'error' ? (
        <View style={styles.alertBanner}>
          <Text style={styles.alertTitle}>Помилка</Text>
          <Text style={styles.alertAction} onPress={load}>
            Спробувати ще раз
          </Text>
        </View>
      ) : null}
      {actionError ? (
        <View style={styles.alertBanner}>
          <Text style={styles.alertTitle}>Помилка</Text>
          <Text style={styles.alertMuted}>{actionError}</Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.title}>Пристрої</Text>
        <Text style={styles.subtitle}>Активні входи в акаунт з інших пристроїв</Text>
      </View>
      {state.kind === 'loading' ? (
        <View style={styles.skeleton}>
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Немає активних пристроїв</Text>
          <Text style={styles.emptyDesc}>Тут з’являться пристрої, з яких ви увійшли в акаунт.</Text>
        </View>
      ) : (
        <>
          {sessions.map((session) => (
            <DeviceListItem key={session.id} session={session} current={session.current} />
          ))}
          <View style={styles.actions}>
            <Text
              style={[styles.dangerButton, others === 0 && styles.dangerDisabled]}
              onPress={() => setConfirmOpen(true)}
              disabled={others === 0}
            >
              Вийти з усіх інших пристроїв
            </Text>
          </View>
        </>
      )}
      {confirmOpen ? (
        <RevokeConfirm
          revoking={revoking}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void confirmRevokeAll()}
        />
      ) : null}
    </View>
  );
}
