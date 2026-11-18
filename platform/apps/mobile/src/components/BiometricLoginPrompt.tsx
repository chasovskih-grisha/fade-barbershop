import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

// Презентаційний блок біометричного входу (T-4426): рішення «коли показувати»
// ухвалює `useBiometricLogin`, тут — лише розмітка й токени теми.
export function BiometricLoginPrompt({
  error,
  onPress,
}: {
  error: string | null;
  onPress: () => void;
}) {
  return (
    <View style={styles.container} testID="biometric-login-prompt">
      <Text style={styles.title}>Швидкий вхід за біометрією</Text>
      <Text style={styles.subtitle}>
        Використайте Face ID або Touch ID для миттєвого доступу до акаунта
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Увійти за допомогою Face ID / Touch ID"
      >
        <Text style={styles.buttonText}>Увійти за допомогою Face ID / Touch ID</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: tokens.color.surface.raised.value,
    borderRadius: tokens.radius.card.value,
    marginVertical: 12,
    gap: 6,
  },
  title: { color: tokens.color.text.primary.value, fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: tokens.color.text.secondary.value, fontSize: 14, marginBottom: 10 },
  error: { color: tokens.color.text.dangerText.value, fontSize: 13, marginBottom: 6 },
  button: {
    backgroundColor: tokens.color.accent.solid.value,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: tokens.radius.input.value,
    alignItems: 'center',
  },
  buttonText: { color: tokens.color.accent.onSolid.value, fontWeight: 'bold', fontSize: 15 },
});
