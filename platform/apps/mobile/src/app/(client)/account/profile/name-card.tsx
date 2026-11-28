import { Pressable, Text, TextInput, View } from 'react-native';
import { tokens } from '@fade/design-tokens';
import { styles } from './profile-styles';
import { NamePrompt } from './name-prompt';
import { ThisDeviceRow } from './this-device-row';
import type { useNameDraft } from './use-name-draft';
import { useVisitCount } from './use-visit-count';
import { formatVisitCount } from './visit-count';
import { SAVE_CONFIRMED } from './save-sentences';

/** Name block of the app profile: prompt, field, save, this device (T-4726c). */
export function NameCard({ draft }: { draft: ReturnType<typeof useNameDraft> }) {
  const visits = useVisitCount();

  return (
    <View style={[styles.card, { marginBottom: 16 }]}>
      <Text style={styles.label}>Ім’я</Text>
      <NamePrompt storedName={draft.storedName} />
      {visits === null ? null : (
        <Text style={styles.visitCount} testID="profile-visit-count">
          {formatVisitCount(visits)}
        </Text>
      )}
      <TextInput
        testID="profile-name-input"
        style={styles.input}
        value={draft.name}
        onChangeText={draft.setName}
        placeholder="Ваше ім’я"
        placeholderTextColor={tokens.color.text.muted.value}
        editable={!draft.saving}
      />
      {draft.error ? (
        <Text testID="profile-name-error" style={styles.errorText}>
          {draft.error}
        </Text>
      ) : null}
      {draft.saved ? (
        <Text testID="profile-name-saved" style={styles.successText}>
          {SAVE_CONFIRMED}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Зберегти ім'я"
        style={[styles.primaryButton, draft.saving && styles.buttonDisabled]}
        onPress={() => void draft.save()}
        disabled={draft.saving}
      >
        <Text
          style={{
            color: tokens.color.accent.onSolid.value,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Зберегти ім&apos;я
        </Text>
      </Pressable>
      <ThisDeviceRow />
    </View>
  );
}
