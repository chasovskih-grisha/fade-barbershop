import { Pressable, Text, TextInput, View } from 'react-native';
import { tokens } from '@fade/design-tokens';
import { savedNoteQuote } from './note';
import { SAVE_CONFIRMED } from './save-sentences';
import { styles } from './profile-styles';
import type { useNoteDraft } from './use-note-draft';

/** Нотатка для майстра (T-4721c): той самий текст, що й у кабінеті на сайті. */
export function NoteCard({ draft }: { draft: ReturnType<typeof useNoteDraft> }) {
  return (
    <View style={[styles.card, { marginBottom: 16 }]} testID="profile-note-card">
      <Text style={styles.label}>Нотатка для майстра</Text>
      <Text style={styles.visitCount}>Цей текст побачить ваш майстер перед візитом</Text>
      <TextInput
        testID="profile-note-input"
        style={[styles.input, { minHeight: 88, textAlignVertical: 'top' }]}
        value={draft.note}
        onChangeText={draft.setNote}
        placeholder="Наприклад: коротше з боків"
        placeholderTextColor={tokens.color.text.muted.value}
        multiline
        editable={!draft.saving}
      />
      {draft.error ? (
        <Text testID="profile-note-error" style={styles.errorText}>
          {draft.error}
        </Text>
      ) : null}
      <Text testID="profile-note-quote" style={styles.visitCount}>
        {savedNoteQuote(draft.savedNote)}
      </Text>
      {draft.saved ? (
        <Text testID="profile-note-saved" style={styles.successText}>
          {SAVE_CONFIRMED}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Зберегти нотатку"
        style={[styles.primaryButton, (!draft.changed || draft.saving) && styles.buttonDisabled]}
        onPress={() => void draft.save()}
        disabled={!draft.changed || draft.saving}
      >
        <Text
          style={{
            color: tokens.color.accent.onSolid.value,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Зберегти нотатку
        </Text>
      </Pressable>
    </View>
  );
}
