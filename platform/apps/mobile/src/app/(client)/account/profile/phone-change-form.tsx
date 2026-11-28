import { Pressable, Text, TextInput, View } from 'react-native';
import { tokens } from '@fade/design-tokens';
import { styles } from './profile-styles';
import type { usePhoneChange } from './use-phone-change';

type Change = ReturnType<typeof usePhoneChange>;

/** Два кроки зміни номера: новий номер → код з нього (T-4720c). */
export function PhoneChangeForm({ change }: { change: Change }) {
  const isCode = change.step === 'code';

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.label}>{isCode ? 'Код з нового номера' : 'Новий номер'}</Text>
      <TextInput
        testID={isCode ? 'profile-phone-code-input' : 'profile-phone-new-input'}
        style={styles.input}
        value={isCode ? change.code : change.phone}
        onChangeText={isCode ? change.setCode : change.setPhone}
        placeholder={isCode ? 'Код з SMS' : '+380 XX XXX XX XX'}
        placeholderTextColor={tokens.color.text.muted.value}
        keyboardType={isCode ? 'number-pad' : 'phone-pad'}
        editable={!change.busy}
      />
      {change.error ? <Text style={styles.errorText}>{change.error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={change.busy}
        style={change.busy && styles.buttonDisabled}
        onPress={() => void (isCode ? change.submitCode() : change.submitNumber())}
      >
        <Text style={styles.primaryButton}>{isCode ? 'Підтвердити' : 'Отримати код'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={change.close} disabled={change.busy}>
        <Text style={styles.dangerButton}>Скасувати</Text>
      </Pressable>
    </View>
  );
}
