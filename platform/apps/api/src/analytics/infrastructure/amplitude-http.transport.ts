// HTTP-транспорт Amplitude Batch API (T-4587). Свій fetch замість SDK: у
// проєкті немає @amplitude/analytics-node, а потрібен лише POST /batch.
// Таймаут обовʼязковий: завислий запит не має блокувати наступні батчі.
import type { AmplitudeTransport } from '../application/amplitude.ports';
import type { AmplitudeEvent } from '../domain/amplitude-events';

export const AMPLITUDE_BATCH_ENDPOINT = 'https://api2.amplitude.com/batch';

type FetchLike = typeof fetch;

export interface AmplitudeTransportOptions {
  fetchImpl?: FetchLike;
  endpoint?: string;
  timeoutMs?: number;
}

export class AmplitudeHttpTransport implements AmplitudeTransport {
  private readonly fetchImpl: FetchLike;
  private readonly endpoint: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly apiKey: string,
    options: AmplitudeTransportOptions = {}
  ) {
    if (!apiKey) throw new RangeError('AmplitudeHttpTransport needs an API key');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.endpoint = options.endpoint ?? AMPLITUDE_BATCH_ENDPOINT;
    this.timeoutMs = options.timeoutMs ?? 5_000;
  }

  async send(events: readonly AmplitudeEvent[]): Promise<void> {
    if (events.length === 0) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ api_key: this.apiKey, events }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Amplitude batch rejected with HTTP ${response.status}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
