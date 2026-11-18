// Кнопки форми редагування референсу (REF-MOB-02) — окремо, щоб поля й
// дії лишались маленькими файлами (LOC-гейт, ADR 0019).
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function FormActions({
  busy,
  disabled,
  onCancel,
  onSave,
}: {
  busy: boolean;
  disabled: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.buttons}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Скасувати"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={onCancel}
      >
        <Text style={styles.cancel}>Скасувати</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Зберегти"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onSave}
      >
        <Text style={[styles.save, disabled ? styles.saveDisabled : null]}>
          {busy ? 'Збереження…' : 'Зберегти'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 4,
  },
  cancel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA0A8',
    paddingVertical: 8,
  },
  save: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111318',
    backgroundColor: '#93C5FD',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  saveDisabled: {
    backgroundColor: '#2A2E36',
    color: '#898D94',
  },
});
