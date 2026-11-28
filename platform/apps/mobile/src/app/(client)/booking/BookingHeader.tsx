import { Pressable, Text, View } from 'react-native';
import { styles } from '../../index.styles';

interface BookingHeaderProps {
  title: string;
  locationName: string | undefined;
  error: string | null;
  onBack: () => void;
}

export function BookingHeader({ title, locationName, error, onBack }: BookingHeaderProps) {
  return (
    <View>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={styles.cardMuted}>← Назад</Text>
      </Pressable>
      <Text style={styles.hero}>{title}</Text>
      {locationName ? <Text style={styles.heroSub}>{locationName}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
