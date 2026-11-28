import { Pressable, Text, View } from 'react-native';
import { usePush } from '@/lib/notifications';
import type { NotificationPreferences } from '@/lib/notification-preferences';
import { SWITCH_OPTIONS } from './notification-switch-options';
import { NotificationSwitchRow } from './notification-switch-row';
import { useNotificationSwitches } from './use-notification-switches';
import { styles } from './profile-styles';

/**
 * Сповіщення профілю застосунку (T-4722c): ті самі чотири перемикачі, що в
 * кабінеті на сайті. Push вмикає і знімає реєстрацію пристрою, але не виходить
 * з акаунта — вихід окремою дією (T-4723).
 */
export function NotificationSwitches() {
  const switches = useNotificationSwitches();
  const push = usePush();
  const disabled = !switches.loaded || switches.saving;

  const change = (key: keyof NotificationPreferences, value: boolean) => {
    switches.toggle(key, value);
    if (key !== 'pushNotifications') return;
    if (value) void push.register().catch(() => undefined);
    else void push.revoke();
  };

  return (
    <View style={styles.section} testID="profile-notification-switches">
      <View style={styles.card}>
        <Text style={styles.label}>Сповіщення</Text>
        <Text style={styles.visitCount}>
          Керуйте каналами та типами сповіщень про ваші візити та записи.
        </Text>
        {push.error ? <Text style={styles.errorText}>{push.error}</Text> : null}
        {SWITCH_OPTIONS.map((option) => (
          <NotificationSwitchRow
            key={option.key}
            option={option}
            value={switches.preferences[option.key]}
            disabled={disabled}
            onChange={(value) => change(option.key, value)}
          />
        ))}
        {switches.status === 'success' ? <Text style={styles.successText}>Збережено</Text> : null}
        {switches.status === 'error' ? (
          <Text style={styles.errorText}>Помилка збереження. Спробуйте ще раз.</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Зберегти налаштування сповіщень"
          style={[styles.primaryButton, disabled && styles.buttonDisabled]}
          onPress={() => void switches.save()}
          disabled={disabled}
        >
          <Text style={styles.primaryButtonText}>
            {switches.saving ? 'Збереження...' : 'Зберегти налаштування'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
