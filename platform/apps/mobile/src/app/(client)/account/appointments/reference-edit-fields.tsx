// Поля форми редагування референсу (REF-MOB-02) — окремі компоненти, щоб
// сама форма лишалась читаною і тримала гейти складності (ADR 0019).
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { COMMENT_MAX, type ReferenceEditor } from './use-reference-editor';
import { styles } from './reference-edit-styles';

/** Коментар майстру: plain text, лічильник до 500 (REF-WEB-02, REF-MOB-03). */
export function CommentField({ editor }: { editor: ReferenceEditor }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Коментар майстру</Text>
      <TextInput
        accessibilityLabel="Коментар майстру"
        value={editor.comment}
        onChangeText={editor.setComment}
        placeholder="зняти на 2 мм, чубчик залишити"
        placeholderTextColor="#5A5F68"
        multiline
        style={styles.input}
      />
      <Text style={[styles.counter, editor.tooLong ? styles.counterError : null]}>
        {`${editor.length}/${COMMENT_MAX}`}
        {editor.tooLong ? ' — скоротіть коментар' : ''}
      </Text>
    </View>
  );
}

/** Вибір/заміна фото: прев'ю з галереї + вивантаження у приватний бакет. */
export function PhotoField({
  app,
  editor,
  busy,
}: {
  app: ExtendedAppointment;
  editor: ReferenceEditor;
  busy: boolean;
}) {
  const locked = busy || editor.uploading;
  return (
    <View style={styles.photoRow}>
      {editor.photo ? (
        <Image
          source={{ uri: editor.photo.uri }}
          style={styles.preview}
          accessibilityLabel="Вибране фото"
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: locked }}
        disabled={locked}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => void editor.choosePhoto()}
      >
        <Text style={styles.action}>
          {editor.uploading ? 'Вивантаження…' : app.referenceId ? 'Замінити фото' : 'Обрати фото'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Зняття наявного фото: `referenceId: ''` прибирає значення (не «не чіпати»). */
export function RemovePhotoToggle({ editor }: { editor: ReferenceEditor }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: editor.removePhoto }}
      accessibilityLabel="Прибрати фото референсу"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={() => editor.setRemovePhoto(!editor.removePhoto)}
      style={styles.toggle}
    >
      <Text style={styles.toggleMark}>{editor.removePhoto ? '☑' : '☐'}</Text>
      <Text style={styles.toggleLabel}>Прибрати фото референсу</Text>
    </Pressable>
  );
}
