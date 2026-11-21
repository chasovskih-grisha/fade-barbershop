// ArchiveBookings (T-4804): холодне зберігання старих записів. Порядок
// строгий: upload → download+checksum → delete. Збій на будь-якому кроці
// лишає рядки в БД (краще дубль в архіві, ніж втрачені дані).
import { checksumOf, encodeArchive, archiveKey } from './archive-manifest';
import type { ArchiveStore, ArchiveUploader, ArchiveRunRecord } from './archive.ports';

export interface ArchiveDeps {
  store: ArchiveStore;
  uploader: ArchiveUploader;
  /** Скільки місяців тримаємо гарячими (дефолт 24). */
  afterMonths?: number;
  /** Розмір батчу (дефолт 500). */
  batchSize?: number;
  /** Запобіжник від нескінченного циклу в межах одного прогону. */
  maxBatches?: number;
  audit?: (record: ArchiveRunRecord) => void;
}

export interface ArchiveResult {
  archived: number;
  remaining: number;
  keys: string[];
}

/**
 * Cutoff: ті самі дата й час N місяців тому (UTC). День підрізається до
 * останнього дня цільового місяця (31 січня − 2 міс = 30 листопада), інакше
 * Date.UTC перекотився б у наступний місяць і cutoff «зʼїхав» би на добу.
 */
export function monthsAgo(now: Date, months: number): Date {
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth() - months;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const day = Math.min(now.getUTCDate(), lastDay);
  return new Date(
    Date.UTC(
      year,
      monthIndex,
      day,
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    )
  );
}

export class ArchiveBookings {
  private readonly afterMonths: number;
  private readonly batchSize: number;
  private readonly maxBatches: number;

  constructor(private readonly deps: ArchiveDeps) {
    this.afterMonths = deps.afterMonths ?? 24;
    this.batchSize = deps.batchSize ?? 500;
    this.maxBatches = deps.maxBatches ?? 200;
  }

  async execute(now: Date = new Date()): Promise<ArchiveResult> {
    const cutoff = monthsAgo(now, this.afterMonths);
    const keys: string[] = [];
    const checksums: string[] = [];
    let archived = 0;
    for (let batch = 0; batch < this.maxBatches; batch += 1) {
      const rows = await this.deps.store.selectExpired(cutoff, this.batchSize);
      if (rows.length === 0) break;
      const key = archiveKey(cutoff, batch);
      const body = encodeArchive(rows);
      const checksum = checksumOf(body);
      await this.deps.uploader.upload(key, body);
      const stored = checksumOf(await this.deps.uploader.download(key));
      if (stored !== checksum) {
        throw new Error(`archive checksum mismatch for ${key}: ${stored} != ${checksum}`);
      }
      await this.deps.store.deleteByIds(rows.map((row) => row.id));
      keys.push(key);
      checksums.push(checksum);
      archived += rows.length;
      if (rows.length < this.batchSize) break;
    }
    const remaining = await this.deps.store.countExpired(cutoff);
    const record: ArchiveRunRecord = {
      cutoff: cutoff.toISOString(),
      archived,
      remaining,
      keys,
      checksums,
    };
    await this.deps.store.recordRun(record, now);
    this.deps.audit?.(record);
    return { archived, remaining, keys };
  }
}
