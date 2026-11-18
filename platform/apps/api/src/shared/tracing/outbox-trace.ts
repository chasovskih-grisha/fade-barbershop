// W3C TraceContext-карірування в payload outbox-подій (T-4204, T-4204f):
// зв'язок «продюсер події ↔ її обробка». Релей продовжує трейс продюсера
// (remote parent): обробка події видна в тому самому трейсі, що й HTTP-запис,
// який її породив. Альтернатива — span links (окремий трейс + link на
// продюсера); для dev v1 обрано parent-based.
// W3C traceparent будуємо напряму зі SpanContext (формат 00-{traceId}-{spanId}-{flags})
// — без зайвої залежності на пакет пропагаторів; семантика та сама, що й у
// глобального W3C-пропагатора SDK (T-4204f).
import {
  context,
  trace,
  Context,
  isSpanContextValid,
  ROOT_CONTEXT,
  SpanContext,
} from '@opentelemetry/api';

/** Ключ W3C-карірування всередині payload події (wire-домен не рухається). */
const TRACE_CARRIER_KEY = 'traceparent';
const TRACEPARENT_RE = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

/**
 * Додати W3C-карірування активного контексту в payload події (мутація
 * in-place) до запису в outbox. Немає активного валідного спана — payload
 * не змінюється (подія поза трейсом чесно не має каузальності).
 */
export function injectOutboxTrace(event: { payload: Record<string, unknown> }): void {
  const span = trace.getSpan(context.active());
  if (!span) return;
  const sc = span.spanContext();
  if (!isSpanContextValid(sc)) return;
  event.payload[TRACE_CARRIER_KEY] =
    `00-${sc.traceId}-${sc.spanId}-${sc.traceFlags.toString(16).padStart(2, '0')}`;
}

/**
 * Витягти W3C-карірування з payload події → Context із remote-parent спаном
 * (non-recording proxy). Каузальності немає (поле відсутнє/невалідне) → undefined.
 */
export function extractOutboxTrace(event: { payload: unknown }): Context | undefined {
  const tp =
    event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
      ? (event.payload as Record<string, unknown>)[TRACE_CARRIER_KEY]
      : undefined;
  if (typeof tp !== 'string') return undefined;
  // 3 групи регексу = traceId/spanId/flags (version без групи — не чіпати,
  // інакше деструктуризація зсувається і extract мовчки повертає undefined).
  const [, traceId, spanId, flags] = TRACEPARENT_RE.exec(tp) ?? [];
  if (!traceId || !spanId || !flags) return undefined;
  const sc: SpanContext = {
    traceId,
    spanId,
    traceFlags: parseInt(flags, 16),
    isRemote: true,
  };
  if (!isSpanContextValid(sc)) return undefined;
  // wrapSpanContext — публічний non-recording спан (OTel v2): remote parent,
  // який релей використовує як батька спана обробки.
  return trace.setSpan(ROOT_CONTEXT, trace.wrapSpanContext(sc));
}
