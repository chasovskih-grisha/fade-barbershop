import { Pressable, Text, View } from 'react-native';
import { styles } from './usual-chair-styles';

/**
 * Підвал картки звичного місця (T-4725c): збереження і очищення. «Очистити»
 * є лише коли збережений id більше не резолвиться — інакше порожній пункт
 * «Не обрано» робить те саме без окремого контрола.
 */
export function UsualChairActions({
  dirty,
  busy,
  error,
  canClear,
  onSave,
  onClear,
}: {
  dirty: boolean;
  busy: boolean;
  error: boolean;
  canClear: boolean;
  onSave: () => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.actions}>
      {error ? <Text style={styles.errorText}>Не вдалося зберегти</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Зберегти звичне місце"
        testID="usual-save"
        onPress={onSave}
        disabled={!dirty || busy}
        style={[styles.primaryButton, (!dirty || busy) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Зберегти звичне місце</Text>
      </Pressable>
      {canClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Очистити звичне місце"
          testID="usual-clear"
          onPress={onClear}
          style={styles.clearButton}
        >
          <Text style={styles.clearText}>Очистити</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
