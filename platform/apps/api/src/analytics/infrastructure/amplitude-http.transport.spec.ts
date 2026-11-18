// T-4587: транспорт шле Batch API-сумісний payload і падає на non-2xx.
import { AmplitudeHttpTransport } from './amplitude-http.transport';
import type { AmplitudeEvent } from '../domain/amplitude-events';

const events: AmplitudeEvent[] = [
  {
    event_type: 'booking_confirmed',
    insert_id: 'booking_confirmed_a_1',
    time: 1_700_000_000_000,
    user_id: 'client-1',
    event_properties: { appointmentId: 'a' },
  },
];

describe('AmplitudeHttpTransport (T-4587)', () => {
  it('надсилає api_key та events у Batch API', async () => {
    const calls: { url: string; body: unknown }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return { ok: true, status: 200 } as Response;
    }) as unknown as typeof fetch;

    await new AmplitudeHttpTransport('fk-test', { fetchImpl }).send(events);

    expect(calls[0]?.url).toBe('https://api2.amplitude.com/batch');
    expect(calls[0]?.body).toEqual({ api_key: 'fk-test', events });
  });

  it('кидає помилку на non-2xx, щоб use case запланував retry', async () => {
    const fetchImpl = (async () => ({ ok: false, status: 503 }) as Response) as unknown as typeof fetch;
    await expect(new AmplitudeHttpTransport('fk-test', { fetchImpl }).send(events)).rejects.toThrow(
      'HTTP 503'
    );
  });

  it('порожній батч не робить запиту', async () => {
    const fetchImpl = (async () => {
      throw new Error('must not be called');
    }) as unknown as typeof fetch;
    await expect(new AmplitudeHttpTransport('fk-test', { fetchImpl }).send([])).resolves.toBeUndefined();
  });

  it('без ключа транспорт не створюється (захист від тихого сміття)', () => {
    expect(() => new AmplitudeHttpTransport('')).toThrow(RangeError);
  });
});
