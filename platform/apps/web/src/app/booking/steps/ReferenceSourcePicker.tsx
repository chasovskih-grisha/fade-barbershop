'use client';

import { AiGenerator } from '../AiGenerator';
import { UploadReferencePanel } from './UploadReferencePanel';

const SOURCE_LABELS = {
  ai: 'З AI-підбору',
  upload: 'Завантажити фото',
  none: 'Без референсу',
} as const;

export function ReferenceSourcePicker({
  referenceSource,
  setReferenceSource,
  selectedVariantObjectKey,
  setSelectedVariantObjectKey,
  uploadedPhoto,
  setUploadedPhoto,
  uploadStatus,
  setUploadStatus,
  uploadError,
  onFileUpload,
  onVariantSelected,
}: {
  referenceSource: 'ai' | 'upload' | 'none';
  setReferenceSource: (source: 'ai' | 'upload' | 'none') => void;
  selectedVariantObjectKey: string | null;
  setSelectedVariantObjectKey: (key: string | null) => void;
  uploadedPhoto: string | null;
  setUploadedPhoto: (photo: string | null) => void;
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error';
  setUploadStatus: (status: 'idle' | 'uploading' | 'done' | 'error') => void;
  uploadError: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVariantSelected: (objectKey: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        {(['ai', 'upload', 'none'] as const).map((source) => (
          <label
            key={source}
            className={`flex items-center gap-3 p-3 rounded-input border transition-colors cursor-pointer ${
              referenceSource === source
                ? 'border-accent-blue bg-interactive'
                : 'border-line hover:bg-interactive'
            }`}
          >
            <input
              type="radio"
              name="referenceSource"
              value={source}
              checked={referenceSource === source}
              onChange={() => setReferenceSource(source)}
              className="accent-accent-blue"
            />
            <span className="text-body">{SOURCE_LABELS[source]}</span>
          </label>
        ))}
      </div>
      {referenceSource === 'ai' && (
        <div className="mt-4">
          <AiGenerator
            sourcePhotoId={selectedVariantObjectKey}
            onVariantSelected={onVariantSelected}
          />
        </div>
      )}
      {referenceSource === 'upload' && (
        <UploadReferencePanel
          uploadedPhoto={uploadedPhoto}
          uploadStatus={uploadStatus}
          uploadError={uploadError}
          onFileUpload={onFileUpload}
          onClear={() => {
            setUploadedPhoto(null);
            setSelectedVariantObjectKey(null);
            setUploadStatus('idle');
          }}
        />
      )}
      {referenceSource === 'none' && (
        <div className="mt-4 text-center text-fg-secondary">
          <p>Запис без референсу — барбер стриже за власним розсувом.</p>
        </div>
      )}
    </>
  );
}
