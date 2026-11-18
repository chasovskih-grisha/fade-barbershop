// Специфікація спільного трейсинг-хелпера (T-4204): W3C-карірування в payload
// outbox-подій і назад. Реальні SdkTracer/NonRecordingSpan недоступні зі спек
// (pnpm-суворість: sdk-trace-base не в прямих dep), тому jest.mock на
// @opentelemetry/api: фейковий Span лише віддає SpanContext — перевіряємо
// логіку хелпера (формат W3C, валідація, парсинг), а не OTel.
// Фікстури — tracing.fakes.ts.
import { trace, type Span } from '@opentelemetry/api';
import { injectOutboxTrace, extractOutboxTrace } from './tracing';
import { SC, fakeSpan, setSpanArg, traceparent } from './tracing.fakes';

// Локальний імпорт tracing.ts бачить свій неймспейс api — spy через spyOn на
// ESM-неймспейс його не ловить, тому мок на рівні модуля (jest.mock).
jest.mock('@opentelemetry/api', () => {
  const actual = jest.requireActual('@opentelemetry/api');
  return {
    ...actual,
    trace: {
      ...actual.trace,
      // getTracer — метод класу TraceAPI: spread втрачає this, тому bind.
      getTracer: actual.trace.getTracer.bind(actual.trace),
      getSpan: jest.fn(),
      // Реальна семантика: setSpan(context, span) → той самий context.
      setSpan: jest.fn((parent: unknown) => parent),
      wrapSpanContext: jest.fn((sc: unknown) => ({ spanContext: () => sc })),
    },
  };
});

beforeEach(() => {
  // inject читає активний спан; extract будує контекст через trace.setSpan.
  (trace.getSpan as jest.Mock).mockReturnValue(fakeSpan);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('injectOutboxTrace', () => {
  it('без активного спана — payload не змінюється', () => {
    (trace.getSpan as jest.Mock).mockReturnValue(undefined);
    const payload: Record<string, unknown> = { locationId: 'loc-1' };

    injectOutboxTrace({ payload });

    expect(payload).toEqual({ locationId: 'loc-1' });
  });

  it('з активним спаном — W3C traceparent у payload (формат 00-trace-span-flags)', () => {
    const payload: Record<string, unknown> = { locationId: 'loc-1' };

    injectOutboxTrace({ payload });

    expect(payload['traceparent']).toBe(traceparent());
  });

  it('невалідний SpanContext — карірування не пишеться', () => {
    (trace.getSpan as jest.Mock).mockReturnValue({
      spanContext: () => ({ ...SC, traceId: 'zzz' }),
    } as unknown as Span);
    const payload: Record<string, unknown> = {};

    injectOutboxTrace({ payload });

    expect(payload['traceparent']).toBeUndefined();
  });
});

describe('extractOutboxTrace', () => {
  it('валідний traceparent → remote-parent контекст (регресія: version без групи)', () => {
    const extracted = extractOutboxTrace({ payload: { traceparent: traceparent() } });

    expect(extracted).toBeDefined();
    const sc = setSpanArg().spanContext();
    // Регресія: якщо version ковтає traceId, spanContext стає spanId — ловимо тут.
    expect(sc.traceId).toBe(SC.traceId);
    expect(sc.spanId).toBe(SC.spanId);
    expect(sc.isRemote).toBe(true);
    expect(sc.traceFlags).toBe(1);
  });

  it('без карірування, з невалідним або не-рядковим — undefined і без setSpan', () => {
    (trace.setSpan as jest.Mock).mockClear();
    // prettier-ignore
    const bad = [undefined, 'nope', '00-xxxx-00f067aa0ba902b7-01', 42, null, [1, 2]] as const;
    for (const raw of bad)
      expect(extractOutboxTrace({ payload: { traceparent: raw } })).toBeUndefined();
    expect(extractOutboxTrace({ payload: null })).toBeUndefined();
    expect(extractOutboxTrace({ payload: [1, 2] })).toBeUndefined();
    expect(trace.setSpan as jest.Mock).not.toHaveBeenCalled();
  });
});
