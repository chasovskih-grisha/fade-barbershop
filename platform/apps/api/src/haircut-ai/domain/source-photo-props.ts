// Метадані SourcePhoto (окремо від поведінки агрегату — гейт max-lines).

export type PhotoDeleteReason = 'user_request' | 'retention_policy' | 'consent_withdrawn';

export interface SourcePhotoProps {
  id: string;
  ownerId: string;
  objectKey: string;
  bucket: string;
  contentType: string;
  sizeBytes: number;
  consentGranted: boolean;
  consentGrantedAt: Date | null;
  consentRevokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
