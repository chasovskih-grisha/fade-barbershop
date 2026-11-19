import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { styles, SPINNER_COLOR } from './index.styles';
import { BiometricLoginPrompt } from '../components/BiometricLoginPrompt';

export function IndexLogin({
  phone,
  setPhone,
  submitting,
  onLogin,
  biometricAvailable,
  biometricError,
  onBiometric,
}: {
  phone: string;
  setPhone: (v: string) => void;
  submitting: boolean;
  onLogin: () => void;
  biometricAvailable: boolean;
  biometricError: string | null;
  onBiometric: () => void;
}) {
  return (
    <View style={{ padding: 20 }}>
      {biometricAvailable ? (
        <BiometricLoginPrompt error={biometricError} onPress={onBiometric} />
      ) : null}
      <Text style={styles.hero}>Вхід за телефоном</Text>
      <TextInput
        accessibilityLabel="Телефон"
        placeholder="+380..."
        value={phone}
        onChangeText={setPhone}
        style={styles.loginInput}
      />
      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={onLogin}
        style={[styles.cta, submitting && styles.ctaDisabled]}
      >
        {submitting ? (
          <ActivityIndicator testID="submit-spinner" color={SPINNER_COLOR} />
        ) : (
          <Text style={styles.ctaLabel}>Отримати код</Text>
        )}
      </Pressable>
    </View>
  );
}
