// Кореляція лог ↔ трейс (T-4204f): активний спан → traceId/spanId у рядку,
// і вони збігаються зі spanContext. Реальний TracerProvider зі стека
// (@opentelemetry/sdk-trace приходить зі sdk-node) — не мок, щоб перевірити
// справжню інтеграцію active-context → лог. OTel v2: процесори — у конструкторі.
// У jest немає автостарту sdk-node, тож context manager реєструємо явно —
// той самий ALS-менеджер, що sdk-node ставить у застосунку (live-трейси це
// підтверджують); без нього Node 25 не зберігає BaseContext у context.with.
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { trace, context, type ContextManager } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { DailyFileLogger } from './daily-file.logger';

// sdk-trace не є прямою залежністю: його підтягує sdk-node. Статичний import
// ламає мікс типів v1/v2, тож читаємо пакет з контексту sdk-node.
const requireFromSdk = createRequire(createRequire(__filename).resolve('@opentelemetry/sdk-node'));
const { TracerProvider, SimpleSpanProcessor, InMemorySpanExporter } = requireFromSdk(
  '@opentelemetry/sdk-trace'
) as {
  TracerProvider: new (config: { spanProcessors: unknown[] }) => {
    getTracer: (name: string) => ReturnType<typeof trace.getTracer>;
  };
  SimpleSpanProcessor: new (exporter: unknown) => unknown;
  InMemorySpanExporter: new () => unknown;
};

describe('DailyFileLogger trace correlation (T-4204f)', () => {
  beforeAll(() => {
    // sdk-node у prod реєструє ALS-менеджер у register(); у спекі — вручну.
    context.setGlobalContextManager(
      new AsyncLocalStorageContextManager().enable() as ContextManager
    );
  });

  it('рядок у спані несе traceId/spanId активного контексту', async () => {
    // Ізоляція: власний provider (глобальний у jest зареєстрований sdk-node
    // тільки в застосунку; тут реєструємо локальний через контекст-API).
    const provider = new TracerProvider({
      spanProcessors: [new SimpleSpanProcessor(new InMemorySpanExporter())],
    });
    const tracer = (
      provider as { getTracer: (n: string) => ReturnType<typeof trace.getTracer> }
    ).getTracer('test');

    const dir = mkdtempSync(join(tmpdir(), 'fade-log-trace-'));
    const logger = new DailyFileLogger(dir);

    let ids = '';
    const span = tracer.startSpan('unit-op');
    await context.with(trace.setSpan(context.active(), span), async () => {
      const ctx = span.spanContext();
      ids = `${ctx.traceId} ${ctx.spanId}`;
      logger.log('inside-span', 'Test');
      await logger.close();
      span.end();
    });

    const [traceId, spanId] = ids.split(' ');
    const day = new Date();
    const key = `${day.getFullYear()}/${String(day.getMonth() + 1).padStart(2, '0')}/${String(day.getDate()).padStart(2, '0')}`;
    const row = JSON.parse(readFileSync(join(dir, key, 'api.log'), 'utf8')) as {
      traceId?: string;
      spanId?: string;
      msg?: string;
    };
    expect(row.msg).toBe('inside-span');
    expect(row.traceId).toBe(traceId);
    expect(row.spanId).toBe(spanId);

    rmSync(dir, { recursive: true, force: true });
  });
});
