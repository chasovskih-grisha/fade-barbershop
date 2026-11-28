import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { styles } from './profile-styles';
import { PhoneChangeForm } from './phone-change-form';
import { usePhoneChange } from './use-phone-change';

/**
 * Блок «Номер телефону» на профілі застосунку (T-4720c): показує номер
 * з identity і запускає наявну зміну номера. Успіх веде на форму входу.
 */
export function PhoneCard({ phone }: { phone: string }) {
  const change = usePhoneChange(() => router.replace('/'));

  return (
    <View style={[styles.card, { marginBottom: 16 }]} testID="profile-phone-card">
      <Text style={styles.label}>Номер телефону</Text>
      <Text style={styles.phoneValue} testID="profile-phone">
        {phone}
      </Text>
      {change.step === 'closed' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Змінити номер"
          testID="profile-phone-change"
          onPress={change.open}
        >
          <Text style={styles.primaryButton}>Змінити номер</Text>
        </Pressable>
      ) : (
        <PhoneChangeForm change={change} />
      )}
    </View>
  );
}
