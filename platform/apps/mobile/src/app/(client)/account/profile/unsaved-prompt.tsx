import { Modal, Pressable, Text, View } from 'react-native';
import { dialog as styles } from './unsaved-styles';
import {
  UNSAVED_DESCRIPTION,
  UNSAVED_DISCARD,
  UNSAVED_SAVE,
  UNSAVED_STAY,
  UNSAVED_TITLE,
} from './unsaved-guard';
import type { UnsavedGuard } from './use-unsaved-leave';

/** «Зберегти зміни?» з трьома відповідями сайту (T-4733c). */
export function UnsavedPrompt({ prompt }: { prompt: UnsavedGuard }) {
  const disabled = prompt.saving;
  return (
    <Modal visible={prompt.open} transparent animationType="fade" onRequestClose={prompt.stay}>
      <View style={styles.backdrop} testID="profile-unsaved-prompt">
        <View style={styles.dialog}>
          <Text style={styles.title}>{UNSAVED_TITLE}</Text>
          <Text style={styles.description}>{UNSAVED_DESCRIPTION}</Text>
          <View style={styles.actions}>
            <Pressable
              testID="profile-unsaved-save"
              accessibilityRole="button"
              accessibilityLabel={UNSAVED_SAVE}
              style={[styles.primary, disabled && styles.disabled]}
              onPress={() => void prompt.save()}
              disabled={disabled}
            >
              <Text style={styles.primaryText}>
                {prompt.saving ? 'Збереження...' : UNSAVED_SAVE}
              </Text>
            </Pressable>
            <Pressable
              testID="profile-unsaved-discard"
              accessibilityRole="button"
              accessibilityLabel={UNSAVED_DISCARD}
              style={[styles.secondary, disabled && styles.disabled]}
              onPress={prompt.discard}
              disabled={disabled}
            >
              <Text style={styles.secondaryText}>{UNSAVED_DISCARD}</Text>
            </Pressable>
            <Pressable
              testID="profile-unsaved-stay"
              accessibilityRole="button"
              accessibilityLabel={UNSAVED_STAY}
              style={[styles.ghost, disabled && styles.disabled]}
              onPress={prompt.stay}
              disabled={disabled}
            >
              <Text style={styles.ghostText}>{UNSAVED_STAY}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
