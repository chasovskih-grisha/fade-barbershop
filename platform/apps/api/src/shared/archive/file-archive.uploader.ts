// Файловий бекенд архіву (T-4804). Той самий порт, що й для S3/MinIO:
// локальний каталог (ARCHIVE_DIR, дефолт var/archive) монтується як тому,
// тож у dev/CI архів перевіряється без мережі й без креденшелів.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { ArchiveUploader } from './archive.ports';

export class FileArchiveUploader implements ArchiveUploader {
  private readonly baseDir: string;

  constructor(baseDir = process.env.ARCHIVE_DIR ?? 'var/archive') {
    // resolve + join: ключ архіву не може вийти за межі каталогу.
    this.baseDir = resolve(baseDir);
  }

  private pathFor(key: string): string {
    const path = resolve(join(this.baseDir, key));
    if (!path.startsWith(this.baseDir))
      throw new RangeError(`archive key escapes base dir: ${key}`);
    return path;
  }

  async upload(key: string, body: Buffer): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async download(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key));
  }
}
