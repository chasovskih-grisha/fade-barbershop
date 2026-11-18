import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { tokens } from '@fade/design-tokens';
import { styles } from './kit-styles';

export function MobileField({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function MobilePhoneInput({ value, onChangeText, error, disabled, testID }: { value: string; onChangeText: (v: string) => void; error?: string | undefined; disabled?: boolean; testID?: string }) {
  return (
    <MobileField label="Номер телефону" error={error}>
      <TextInput
        testID={testID || "phone-input"}
        placeholder="+380..."
        placeholderTextColor={tokens.color.text.muted.value}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        style={styles.input}
      />
    </MobileField>
  );
}

export function MobileOtpInput({ value, onChangeText, testID }: { value: string; onChangeText: (v: string) => void; testID?: string }) {
  return (
    <MobileField label="OTP код">
      <TextInput
        testID={testID || "otp-input"}
        placeholder="1111"
        placeholderTextColor={tokens.color.text.muted.value}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        maxLength={4}
        style={styles.input}
      />
    </MobileField>
  );
}

export function MobileSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!visible) return null;
  return (
    <View testID="mobile-sheet" style={styles.sheet}>
      <Pressable onPress={onClose}><Text style={styles.closeText}>Закрити</Text></Pressable>
      {children}
    </View>
  );
}
