import { Pressable, Text, View } from 'react-native';
import { styles } from './profile-styles';

const DOORS = [
  { key: 'visits', label: 'Мої візити', href: '/(client)/account/appointments' },
  { key: 'devices', label: 'Пристрої', href: '/(client)/account/devices' },
  // T-4616b: барбер позначає «не вийду» з власного графіка; для клієнта
  // екран пояснює, що графік не делеговано, і нічого не змінює.
  { key: 'schedule', label: 'Мій графік', href: '/(client)/barber-schedule' },
] as const;

/** Переходи акаунта (T-4732): рядки профілю, що відкривають наявні екрани. */
export function ProfileDoors({ onOpen }: { onOpen: (href: string) => void }) {
  return (
    <View style={styles.section} testID="profile-doors">
      {DOORS.map((door) => (
        <Pressable
          key={door.key}
          testID={`profile-door-${door.key}`}
          accessibilityRole="link"
          accessibilityLabel={door.label}
          style={styles.deviceRow}
          onPress={() => onOpen(door.href)}
        >
          <Text style={styles.deviceLink}>{door.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
