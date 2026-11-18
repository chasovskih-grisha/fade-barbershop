// Спільні фікстури W3C-карірування для спеки tracing (T-4204): валідний
// SpanContext, фейковий Span і хелпери читання аргументів mock-викликів.
// jest.mock('@opentelemetry/api') лишається у *spec.ts — його хойстить Jest.
import { trace, type Span, type SpanContext } from '@opentelemetry/api';

export const SC: SpanContext = {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId: '00f067aa0ba902b7',
  traceFlags: 1,
};

export const fakeSpan = { spanContext: () => SC } as unknown as Span;

/** W3C traceparent із SC. */
export const traceparent = () => `00-${SC.traceId}-${SC.spanId}-01`;

/** Другий аргумент першого виклику trace.setSpan (span із remote-контекстом). */
export function setSpanArg(): { spanContext: () => SpanContext } {
  const call = (trace.setSpan as jest.Mock).mock.calls[0];
  if (!call) throw new Error('trace.setSpan not called');
  return call[1] as { spanContext: () => SpanContext };
}
