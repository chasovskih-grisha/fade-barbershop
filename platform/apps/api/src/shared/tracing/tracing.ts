// Спільний трейсинг-хелпер (T-4204, доменні спани поверх T-4204f):
// async-обгортка span для use cases/релеїв + назви спанів/атрибутів.
// W3C-карірування outbox-подій — у сусідньому outbox-trace.ts (реекспорт
// нижче тримає стабільний імпорт '../../shared/tracing/tracing' для споживачів).
import { context, trace, Context, Span, SpanOptions, SpanStatusCode } from '@opentelemetry/api';

export { extractOutboxTrace, injectOutboxTrace } from './outbox-trace';

/** Назви спанів і атрибутів — спільні для продюсера і споживача. */
export const TRACING = {
  /** Спан «події записані в outbox» (всередині транзакції продюсера). */
  OUTBOX_APPEND: 'outbox.append',
  /** Спан обробки однієї події споживачем (релей як джерело спанів). */
  OUTBOX_HANDLE: 'outbox.handle',
  /** Спан booking-флоу (use case запису). */
  BOOKING_BOOK: 'booking.book',
  /** Спан перенесення запису (T-4533; подія rescheduled теж каузально зв'язана). */
  BOOKING_RESCHEDULE: 'booking.reschedule',
  /** Атрибут: тип події outbox. */
  EVENT_TYPE: 'fade.event_type',
  /** Атрибут: id події outbox. */
  EVENT_ID: 'fade.event_id',
  /** Атрибут: результат обробки (applied/duplicate/skipped/ignored). */
  HANDLE_REASON: 'fade.handle_reason',
  /** Атрибут: скільки подій записано за раз. */
  EVENT_COUNT: 'fade.event_count',
} as const;

/** Аргументи withSpan — bundle (гейт max-params): name/options/work/parent. */
export interface WithSpanArgs<T> {
  name: string;
  options?: SpanOptions;
  work: (span: Span) => Promise<T>;
  /** Контекст (наприклад, з extractOutboxTrace): спан стає нащадком remote-спана продюсера. */
  parent?: Context;
}

/**
 * Обгортка роботи в активний span: OK/ERROR за результатом, recordException
 * для Error, end() завжди. OTel API noop до sdk.start() — чистий виклик без
 * реєстрації SDK просто виконує work().
 */
export async function withSpan<T>(args: WithSpanArgs<T>): Promise<T> {
  const { name, options, work, parent } = args;
  return tracer().startActiveSpan(name, options ?? {}, parent ?? context.active(), async (span) => {
    try {
      const result = await work(span);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return result;
    } catch (error) {
      if (error instanceof Error) span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.end();
      throw error;
    }
  });
}

function tracer() {
  return trace.getTracer('fade-shared-tracing', '1.0.0');
}
