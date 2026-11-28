import { Switch, Text, View } from 'react-native';
import { styles } from './profile-styles';
import type { SwitchOption } from './notification-switch-options';

/** Один рядок перемикача: підпис, пояснення і сам Switch (T-4722c). */
export function NotificationSwitchRow({
  option,
  value,
  disabled,
  onChange,
}: {
  option: SwitchOption;
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.switchRow, option.bordered && styles.switchRowBordered]}>
      <View style={styles.switchInfo}>
        <Text style={styles.switchLabel}>{option.label}</Text>
        <Text style={styles.switchDescription}>{option.description}</Text>
      </View>
      <Switch
        accessibilityLabel={option.label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      />
    </View>
  );
}
