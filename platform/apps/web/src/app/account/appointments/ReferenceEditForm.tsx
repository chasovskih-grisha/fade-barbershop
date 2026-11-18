'use client';

// Форма редагування референсу/коментаря (T-043, REF-WEB-04): коментар ≤500
// символів, заміна або зняття фото. Правило доступу задає сервер — клієнт може
// змінювати лише поки візит не підтверджено (інакше 409, кнопки немає).
import { AlertBanner, Button, Checkbox } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { UploadReferencePanel } from '../../booking/steps/UploadReferencePanel';
import { useReferenceEditor, COMMENT_MAX, type ReferenceEdit } from './useReferenceEditor';

export function ReferenceEditForm({
  visit,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  visit: ExtendedAppointment;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (reference: ReferenceEdit) => void;
}) {
  const editor = useReferenceEditor(visit.referenceComment);
  const length = editor.comment.trim().length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-s text-fg-secondary">
        Зміни можливі, поки майстер не підтвердив запис. Після підтвердження — лише перегляд.
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor="reference-comment" className="text-body-s text-fg-secondary">
          Коментар майстру
        </label>
        <textarea
          id="reference-comment"
          value={editor.comment}
          onChange={(e) => editor.setComment(e.target.value)}
          rows={4}
          placeholder="зняти на 2 мм, чубчик залишити"
          className="rounded-input border border-line bg-surface-base px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        />{' '}
        <span className={`text-xs ${editor.tooLong ? 'text-danger' : 'text-fg-secondary'}`}>
          {length}/{COMMENT_MAX}
          {editor.tooLong ? ' — закороткий опис потрібніший' : ''}
        </span>
      </div>
      <UploadReferencePanel
        uploadedPhoto={editor.preview}
        uploadStatus={editor.uploadStatus}
        uploadError={editor.uploadError}
        onFileUpload={editor.handleFileUpload}
        onClear={editor.clearPhoto}
      />{' '}
      <Checkbox
        label="Прибрати фото референсу"
        checked={editor.removePhoto}
        onChange={(e) => editor.setRemovePhoto(e.target.checked)}
      />
      {error ? <AlertBanner tone="error" title={error} /> : null}
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Скасувати
        </Button>
        <Button
          onClick={() => onConfirm(editor.payload())}
          disabled={busy || editor.tooLong || editor.uploading}
        >
          {busy ? 'Збереження...' : 'Зберегти'}
        </Button>
      </div>
    </div>
  );
}
