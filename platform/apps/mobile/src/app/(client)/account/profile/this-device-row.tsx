import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { channelLabel, otherDevicesLabel } from './this-device';
import { useThisDevice } from './use-this-device';
import { styles } from './profile-styles';

/** Рядок «Цей пристрій» у «Акаунті» (T-4724c): канал + перехід на екран пристроїв. */
export function ThisDeviceRow() {
  const device = useThisDevice();
  const channel = channelLabel(device.channel);
  const others = otherDevicesLabel(device.others);

  return (
    <Pressable
      testID="profile-this-device"
      accessibilityRole="link"
      accessibilityLabel="Цей пристрій"
      style={styles.deviceRow}
      onPress={() => router.push('/(client)/account/devices')}
    >
      <Text style={styles.deviceLink}>Цей пристрій</Text>
      {channel ? <Text style={styles.deviceMeta}>{channel}</Text> : null}
      {others ? <Text style={styles.deviceMeta}>· {others}</Text> : null}
    </Pressable>
  );
}
