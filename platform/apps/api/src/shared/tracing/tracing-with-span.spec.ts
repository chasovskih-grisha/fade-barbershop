import { SpanStatusCode, type Span } from '@opentelemetry/api';
import { withSpan, TRACING } from './tracing';

describe('withSpan', () => {
  it('у noop-трейсері просто виконує роботу і повертає результат', async () => {
    const result = await withSpan({ name: TRACING.OUTBOX_APPEND, work: async () => 'ok' });
    expect(result).toBe('ok');
  });

  it('кидок прокидається (span ERROR прихований у noop-трейсері)', async () => {
    await expect(
      withSpan({
        name: 'x',
        work: async (span: Span) => {
          span.setStatus({ code: SpanStatusCode.OK });
          throw new Error('boom');
        },
      })
    ).rejects.toThrow('boom');
  });
});
