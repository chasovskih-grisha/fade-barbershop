// T-4804: архівування — батчинг, порядок upload→verify→delete, відмова на
// зіпсованому архіві й аудит залишку.
import { ArchiveBookings, monthsAgo } from './archive-bookings.use-case';
import type {
  ArchiveStore,
  ArchiveUploader,
  ArchivedBooking,
  ArchiveRunRecord,
} from './archive.ports';
import { checksumOf, decodeArchive, encodeArchive } from './archive-manifest';

const NOW = new Date('2026-11-17T12:00:00Z');

class FakeStore implements ArchiveStore {
  rows: ArchivedBooking[];
  readonly deleted: string[][] = [];
  readonly runs: ArchiveRunRecord[] = [];
  constructor(rows: ArchivedBooking[]) {
    this.rows = rows;
  }
  async selectExpired(_cutoff: Date, limit: number): Promise<ArchivedBooking[]> {
    return this.rows.slice(0, limit);
  }
  async deleteByIds(ids: string[]): Promise<number> {
    this.deleted.push(ids);
    this.rows = this.rows.filter((row) => !ids.includes(row.id));
    return ids.length;
  }
  async countExpired(): Promise<number> {
    return this.rows.length;
  }
  async recordRun(record: ArchiveRunRecord): Promise<void> {
    this.runs.push(record);
  }
}

class FakeUploader implements ArchiveUploader {
  readonly objects = new Map<string, Buffer>();
  corrupt = false;
  async upload(key: string, body: Buffer): Promise<void> {
    this.objects.set(key, body);
  }
  async download(key: string): Promise<Buffer> {
    const body = this.objects.get(key);
    if (!body) throw new Error(`missing object ${key}`);
    return this.corrupt ? Buffer.concat([body, Buffer.from('x')]) : body;
  }
}

const booking = (id: string): ArchivedBooking => ({
  id,
  start: '2024-01-05T10:00:00Z',
  clientId: `c-${id}`,
});

describe('ArchiveBookings (T-4804)', () => {
  it('cutoff віднімає місяці в UTC', () => {
    expect(monthsAgo(NOW, 24).toISOString()).toBe('2024-11-17T12:00:00.000Z');
    expect(monthsAgo(new Date('2027-01-31T00:00:00Z'), 2).toISOString()).toBe(
      '2026-11-30T00:00:00.000Z'
    );
  });

  it('вивантажує батчами, перевіряє checksum і видаляє лише після звірки', async () => {
    const store = new FakeStore([booking('1'), booking('2'), booking('3')]);
    const uploader = new FakeUploader();
    const archive = new ArchiveBookings({ store, uploader, batchSize: 2, afterMonths: 24 });

    const result = await archive.execute(NOW);

    expect(result.archived).toBe(3);
    expect(result.remaining).toBe(0);
    expect(result.keys).toEqual([
      'archive/bookings/2024-11/part-0000.json.gz',
      'archive/bookings/2024-11/part-0001.json.gz',
    ]);
    const first = uploader.objects.get(result.keys[0] ?? '');
    expect(first).toBeDefined();
    expect(decodeArchive(first ?? Buffer.alloc(0))).toHaveLength(2);
    expect(store.runs[0]?.archived).toBe(3);
    expect(store.runs[0]?.checksums?.[0]).toBe(checksumOf(first ?? Buffer.alloc(0)));
  });

  it('не видаляє рядки, якщо checksum не збігся', async () => {
    const store = new FakeStore([booking('1')]);
    const uploader = new FakeUploader();
    uploader.corrupt = true;
    const archive = new ArchiveBookings({ store, uploader, batchSize: 10 });

    await expect(archive.execute(NOW)).rejects.toThrow('checksum mismatch');
    expect(store.deleted).toEqual([]);
    expect(store.rows).toHaveLength(1);
  });

  it('порожній прогін не створює обʼєктів, але пише аудит', async () => {
    const store = new FakeStore([]);
    const uploader = new FakeUploader();
    const result = await new ArchiveBookings({ store, uploader }).execute(NOW);

    expect(result).toEqual({ archived: 0, remaining: 0, keys: [] });
    expect(uploader.objects.size).toBe(0);
    expect(store.runs).toHaveLength(1);
  });

  it('архів стискає JSON, тож gzip-байти коротші за JSON', () => {
    const rows = Array.from({ length: 50 }, (_, index) => booking(String(index)));
    expect(encodeArchive(rows).length).toBeLessThan(Buffer.from(JSON.stringify(rows)).length);
  });
});
