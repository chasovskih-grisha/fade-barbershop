import { Text, View } from 'react-native';
import { styles } from '../../index.styles';

export function BookingLoading() {
  return (
    <View style={[styles.content, styles.center]}>
      <Text style={styles.cardMuted}>Завантаження...</Text>
    </View>
  );
}
