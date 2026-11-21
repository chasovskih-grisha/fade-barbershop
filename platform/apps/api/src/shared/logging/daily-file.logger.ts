import { mkdirSync, createWriteStream, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import type { LoggerService } from '@nestjs/common';

/** Trace-кореляція (T-4204f): активний спан → trace_id/span_id; м'який імпорт —
 * SDK може бути не зареєстрований (тести, dev без otel). */
// prettier-ignore
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

/** Daily file logger (T-apply): Nest LoggerService для NestFactory.create.
 * Кожен запис — у <api>/var/logs/{YYYY}/{MM}/{DD}/api.log; новий день відкривається
 * ліниво (без демона/ротації); payload ASCII-only — байт-в-байт на будь-якому транспорті. */
export class DailyFileLogger implements LoggerService {
  private stream: WriteStream | null = null;
  private currentDayKey = '';
  private ctx = 'App';

  constructor(
    private readonly logsRoot: string,
    private readonly fileName = 'api.log',
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Nest LoggerService surface. */
  log(message: unknown, context?: string): void {
    this.append(context ?? this.ctx, 'INFO', message);
  }
  warn(message: unknown, context?: string): void {
    this.append(context ?? this.ctx, 'WARN', message);
  }
  error(message: unknown, stack?: string, context?: string): void {
    const detail = message instanceof Error ? (message.stack ?? message.message) : message;
    const text =
      typeof stack === 'string' && stack.length > 0 ? `${String(detail)}\n${stack}` : detail;
    this.append(context ?? this.ctx, 'ERROR', text);
  }
  debug?(message: unknown, context?: string): void {
    this.append(context ?? this.ctx, 'DEBUG', message);
  }
  verbose?(message: unknown, context?: string): void {
    this.append(context ?? this.ctx, 'VERBOSE', message);
  }
  fatal?(message: unknown, context?: string): void {
    this.append(context ?? this.ctx, 'FATAL', message);
  }
  setContext(context: string): void {
    this.ctx = context;
  }

  /** Internal helpers. */
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
        src: this.ctx,
        msg: typeof msg === 'string' ? msg : String(msg),
        ...activeTrace(),
      }) + '\n';
    const key = this.dayKey(now);
    if (!this.stream || key !== this.currentDayKey) this.open(key);
    this.stream?.write(line);
  }

  /** Лінивe відкриття файла нового дня (групування YYYY/MM/DD за локальним часом). */
  private open(key: string): void {
    this.stream?.end();
    mkdirSync(join(this.logsRoot, key), { recursive: true });
    this.stream = createWriteStream(join(this.logsRoot, key, this.fileName), { flags: 'a' });
    this.currentDayKey = key;
  }

  /** Close the current day file on app shutdown. */
  async close(): Promise<void> {
    if (this.stream) {
      const s = this.stream;
      this.stream = null;
      await new Promise<void>((resolve) => s.end(() => resolve()));
    }
  }
}
