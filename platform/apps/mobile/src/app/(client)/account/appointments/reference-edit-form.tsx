import { Text, View } from 'react-native';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { useReferenceEditor, type ReferenceEdit } from './use-reference-editor';
import { CommentField, PhotoField, RemovePhotoToggle } from './reference-edit-fields';
import { FormActions } from './reference-edit-actions';
import { styles } from './reference-edit-styles';

export interface ReferenceEditFormProps {
  app: ExtendedAppointment;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (edit: ReferenceEdit) => void;
}

/**
 * Редагування референсу/коментаря в картці візиту (REF-MOB-02, правило
 * REF-WEB-04). Форма доступна лише поки візит не підтверджений барбером —
 * це вирішує `app.canEditReference` (його ставить сервер), а остаточний замок
 * тримає API → 409.
 */
export function ReferenceEditForm({ app, busy, error, onCancel, onSave }: ReferenceEditFormProps) {
  const editor = useReferenceEditor(app.referenceComment);

  const disabled = busy || editor.tooLong || editor.uploading || !editor.hasChanges;
  const showUploadError = Boolean(editor.uploadError);

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>
        Зміни можливі, поки майстер не підтвердив запис. Після підтвердження — лише перегляд.
      </Text>

      <CommentField editor={editor} />
      <PhotoField app={app} editor={editor} busy={busy} />
      <RemovePhotoToggle editor={editor} />

      {showUploadError ? <Text style={styles.error}>{editor.uploadError}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FormActions
        busy={busy}
        disabled={disabled}
        onCancel={onCancel}
        onSave={() => onSave(editor.payload())}
      />
    </View>
  );
}
