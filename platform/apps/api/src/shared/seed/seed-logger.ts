// Подібний до DailyFileLogger (src/shared/logging) контракт для seed-скриптів:
// JSONL рядки у var/logs/{YYYY}/{MM}/{DD}/seed.log, context — назва скрипта.
// Використовується лише у .ts-скриптах (ts-node), що імпортують з src/.
import { mkdirSync, createWriteStream, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

type ActiveContext = { traceId: string; spanId: string } | null;

function activeTrace(): ActiveContext {
  try {
    const api = createRequire(__filename)(
      '@opentelemetry/api'
    ) as typeof import('@opentelemetry/api');
    const span = api.trace.getSpan(api.context.active());
    if (!span) return null;
    const { traceId, spanId } = span.spanContext();
    return traceId && spanId ? { traceId, spanId } : null;
  } catch {
    return null;
  }
}

interface SeedFileLoggerOptions {
  fileName?: string;
  now?: () => Date;
  context?: string;
}

export class SeedFileLogger {
  private stream: WriteStream | null = null;
  private currentDayKey = '';
  private readonly fileName: string;
  private readonly now: () => Date;
  private context: string;

  constructor(
    private readonly logsRoot: string,
    options?: SeedFileLoggerOptions
  ) {
    this.fileName = options?.fileName ?? 'seed.log';
    this.now = options?.now ?? (() => new Date());
    this.context = options?.context ?? 'seed';
  }

  log(message: unknown, ctx?: string): void {
    this.append(ctx ?? this.context, 'INFO', message);
  }

  warn(message: unknown, ctx?: string): void {
    this.append(ctx ?? this.context, 'WARN', message);
  }

  error(message: unknown, stack?: string, ctx?: string): void {
    this.append(ctx ?? this.context, 'ERROR', stack ?? message);
  }

  private dayKey(date: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}/${p(date.getMonth() + 1)}/${p(date.getDate())}`;
  }

  private append(ctx: string, level: string, msg: unknown): void {
    const now = this.now();
    const line =
      JSON.stringify({
        ts: now.toISOString(),
        level,
        ctx,
        src: this.context,
        msg: typeof msg === 'string' ? msg : String(msg),
        ...activeTrace(),
      }) + '\n';
    const key = this.dayKey(now);
    if (!this.stream || key !== this.currentDayKey) this.open(key);
    this.stream?.write(line);
  }

  private open(key: string): void {
    this.stream?.end();
    mkdirSync(join(this.logsRoot, key), { recursive: true });
    this.stream = createWriteStream(join(this.logsRoot, key, this.fileName), { flags: 'a' });
    this.currentDayKey = key;
  }

  async close(): Promise<void> {
    if (this.stream) {
      const s = this.stream;
      this.stream = null;
      await new Promise<void>((resolve) => s.end(() => resolve()));
    }
  }
}

// Singleton, тоді як у main.ts — одна файл-сесія для всіх скриптів.
export const logger = new SeedFileLogger(join(process.cwd(), 'var', 'logs'), {
  fileName: 'seed.log',
});

// Допоміжна функція для скриптів, що хочуть власний context.
export function createLogger(context: string): SeedFileLogger {
  return new SeedFileLogger(join(process.cwd(), 'var', 'logs'), { context });
}
