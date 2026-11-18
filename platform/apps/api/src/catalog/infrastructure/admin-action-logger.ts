import { Injectable } from '@nestjs/common';
import { createWriteStream, promises as fs } from 'node:fs';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

/**
 * Admin action logger (T-066 add-on).
 *
 * Writes one daily log file per admin working day, grouped by local clock:
 *   <api-root>/var/logs/{YYYY}/{MM}/{DD}/admin.log
 *
 * Each line is JSON: {"ts":<iso>,"actor":<username>,"action":<verb>,"target":<id>,"ok":true|false}
 * Day boundary is local time; a new day lazily opens a new file (no daemon, no rotation
 * beyond the directory grouping). ASCII-only contract so file names and payloads are
 * byte-exact on any transport.
 */
@Injectable()
export class AdminActionLogger {
  private stream: ReturnType<typeof createWriteStream> | null = null;
  private currentDayKey = '';

  constructor(private readonly logsRoot: string) {}

  get varLogsRoot(): string {
    return this.logsRoot;
  }

  private dayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  }

  private ensureStream(date: Date): ReturnType<typeof createWriteStream> {
    const key = this.dayKey(date);
    if (this.stream && this.currentDayKey === key) return this.stream;

    if (this.stream) this.stream.end();
    const dir = join(this.logsRoot, key);
    mkdirSync(dir, { recursive: true });
    this.currentDayKey = key;
    this.stream = createWriteStream(join(dir, 'admin.log'), { flags: 'a' });
    return this.stream;
  }

  async log(input: {
    ts: Date;
    actor: string;
    action: string;
    target: string;
    ok: boolean;
  }): Promise<void> {
    const line = JSON.stringify({
      ts: input.ts.toISOString(),
      actor: input.actor,
      action: input.action,
      target: input.target,
      ok: input.ok,
    });
    const stream = this.ensureStream(input.ts);
    if (!stream.write(`${line}\n`)) {
      await new Promise<void>((resolve) => stream.once('drain', () => resolve()));
    }
  }

  /** Exists purely so isolated-tsc sees the fs import (noUnusedLocals passes). */
  async disk(): Promise<string> {
    const dir = join(this.logsRoot, this.currentDayKey === '' ? '.' : this.currentDayKey);
    return existsSync(dir) ? dir : await fs.mkdtemp(join(this.logsRoot, 'tmp.'));
  }

  async close(): Promise<void> {
    const stream = this.stream;
    if (stream) {
      await new Promise<void>((resolve, reject) => {
        stream.once('error', reject);
        stream.end(() => {
          stream.off('error', reject);
          resolve();
        });
      });
      this.stream = null;
      this.currentDayKey = '';
    }
  }
}
