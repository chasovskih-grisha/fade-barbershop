// Порти архіву (T-4804): БД (що застаріло) і object storage (куди писати).
// Use case не знає ані Prisma, ані MinIO — тому перевірка checksum-ом і
// порядок «upload → verify → delete» тестуються на фейках.
export const ARCHIVE_STORE = 'ARCHIVE_STORE';
export const ARCHIVE_UPLOADER = 'ARCHIVE_UPLOADER';

export interface ArchivedBooking {
  id: string;
  [field: string]: unknown;
}

export interface ArchiveRunRecord {
  cutoff: string;
  archived: number;
  remaining: number;
  keys: string[];
  checksums: string[];
}

export interface ArchiveStore {
  /** Найстарші бронювання, старші за cutoff. */
  selectExpired(cutoff: Date, limit: number): Promise<ArchivedBooking[]>;
  deleteByIds(ids: string[]): Promise<number>;
  /** Пост-перевірка: скільки прострочених лишилось. */
  countExpired(cutoff: Date): Promise<number>;
  recordRun(record: ArchiveRunRecord, at: Date): Promise<void>;
}

export interface ArchiveUploader {
  upload(key: string, body: Buffer): Promise<void>;
  /** Повертає те, що реально лежить у сховищі (для звірки checksum). */
  download(key: string): Promise<Buffer>;
}
