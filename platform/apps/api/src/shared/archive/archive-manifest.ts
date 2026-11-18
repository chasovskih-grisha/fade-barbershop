// Ключі й контр-суми архіву (T-4804). Архів пишеться в object storage
// (MinIO/S3, ADR 0018) gzip-JSON; checksum фіксується в аудиті, а після
// завантаження перевіряється повторним скачуванням — архів без перевірки не
// вважається записаним і рядки не видаляються.
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';

/** SHA-256 у hex — та сама форма, що в ETag/MinIO-метаданих. */
export function checksumOf(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex');
}

/** Ключ архіву за місяцем cutoff: archive/bookings/2024-01/part-0000.json.gz */
export function archiveKey(cutoff: Date, batchIndex: number): string {
  const month = `${cutoff.getUTCFullYear()}-${String(cutoff.getUTCMonth() + 1).padStart(2, '0')}`;
  return `archive/bookings/${month}/part-${String(batchIndex).padStart(4, '0')}.json.gz`;
}

/** gzip(JSON) — стиснений архів одного батчу. */
export function encodeArchive(rows: readonly unknown[]): Buffer {
  return gzipSync(Buffer.from(JSON.stringify(rows), 'utf8'));
}

/** Розшифровка назад — для перевірки цілісності та тестів. */
export function decodeArchive(body: Buffer): unknown[] {
  return JSON.parse(gunzipSync(body).toString('utf8')) as unknown[];
}
