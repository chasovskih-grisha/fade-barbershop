'use client';

import { Button, Card } from '@fade/ui';
import { ReferenceSourcePicker } from './ReferenceSourcePicker';
import { useReferenceUpload } from './useReferenceUpload';

type Props = {
  referenceSource: 'ai' | 'upload' | 'none';
  setReferenceSource: (source: 'ai' | 'upload' | 'none') => void;
  selectedVariantObjectKey: string | null;
  setSelectedVariantObjectKey: (key: string | null) => void;
  uploadedPhoto: string | null;
  setUploadedPhoto: (photo: string | null) => void;
  comment: string;
  setComment: (c: string) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
};

export function HaircutReferenceStep(props: Props) {
  const {
    referenceSource,
    setReferenceSource,
    selectedVariantObjectKey,
    setSelectedVariantObjectKey,
    uploadedPhoto,
    setUploadedPhoto,
    comment,
    setComment,
    onBack,
    onNext,
    loading = false,
  } = props;
  const upload = useReferenceUpload(setUploadedPhoto, setSelectedVariantObjectKey);

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись
      </Button>
      <h2 className="font-display text-h4">Зачіска і коментар</h2>
      <Card className="p-4">
        <h3 className="font-semibold text-bodyLg mb-3">Референс</h3>
        <ReferenceSourcePicker
          referenceSource={referenceSource}
          setReferenceSource={setReferenceSource}
          selectedVariantObjectKey={selectedVariantObjectKey}
          setSelectedVariantObjectKey={setSelectedVariantObjectKey}
          uploadedPhoto={uploadedPhoto}
          setUploadedPhoto={setUploadedPhoto}
          uploadStatus={upload.uploadStatus}
          setUploadStatus={upload.setUploadStatus}
          uploadError={upload.uploadError}
          onFileUpload={upload.handleFileUpload}
          onVariantSelected={setSelectedVariantObjectKey}
        />
      </Card>
      <Card className="p-4">
        <label htmlFor="haircut-comment" className="font-semibold text-bodyLg mb-3 block">
          Коментар
        </label>
        <textarea
          id="haircut-comment"
          aria-describedby="haircut-comment-counter"
          className="h-32 w-full rounded border border-line bg-surface-base p-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue resize-none"
          maxLength={500}
          placeholder="Коментар до зачіски…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p
          id="haircut-comment-counter"
          className="text-sm text-fg-secondary mt-2 text-right"
        >{`${comment.length}/500`}</p>
      </Card>
      <Button disabled={loading} onClick={onNext}>
        Далі →
      </Button>
    </div>
  );
}

export default HaircutReferenceStep;
