/**
 * RUM Core Web Vitals (T-4204): маяк з реальних браузерів → POST /telemetry/web-vitals
 * (next rewrite проксіює в api). Приватність: жодних cookie/id/шляхів — лише пара
 * (name, rating), тож кардинальність на сервері фіксована 5×3 (web-vitals шле
 * назви у верхньому регістрі — api нормалізує). DNT/GPC → збір вимкнено;
 * семплінг — NEXT_PUBLIC_RUM_SAMPLE_RATE (0..1, дефолт 1 = кожна сесія).
 * RUM не має ламати сторінку: відмова транспорту ковтається.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

export const RUM_ENDPOINT = '/telemetry/web-vitals';
export const DEFAULT_SAMPLE_RATE = 1;

export interface RumSample {
  name: string;
  rating: string;
}

export interface RumTransport {
  /** sendBeacon: true — браузер узяв пакет у чергу. */
  beacon: (url: string, payload: Blob) => boolean;
  fetch: (url: string, init: RequestInit) => void;
}

export interface InitRumOptions {
  rate?: number;
  random?: () => number;
  transport?: RumTransport | null;
}

/** Частка сесій зі збором: 0..1; сміття в env → дефолт, а не 0 мовчки. */
export function sampleRate(value = process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE): number {
  const parsed = Number(value);
  if (value === undefined || value === '' || !Number.isFinite(parsed)) return DEFAULT_SAMPLE_RATE;
  return Math.min(1, Math.max(0, parsed));
}

export function shouldSample(rate: number, random: () => number = Math.random): boolean {
  if (rate <= 0) return false;
  if (rate >= 1) return true;
  return random() < rate;
}

/** Браузер + згода: DNT/GPC поважаємо, SSR не збирає. */
export function rumAllowed(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    doNotTrack?: string | null;
    globalPrivacyControl?: boolean;
  };
  return nav.doNotTrack !== '1' && nav.globalPrivacyControl !== true;
}

function browserTransport(): RumTransport | null {
  if (typeof window === 'undefined') return null;
  const nav = navigator as Navigator & { sendBeacon?: (url: string, data?: Blob) => boolean };
  return {
    beacon: (url, payload) =>
      typeof nav.sendBeacon === 'function' ? nav.sendBeacon(url, payload) : false,
    fetch: (url, init) => {
      void window.fetch(url, init).catch(() => undefined);
    },
  };
}

/** Один семпл: beacon (переживає вигрузку сторінки), інакше keepalive-fetch. */
export function sendSample(
  sample: RumSample,
  transport: RumTransport | null = browserTransport()
): boolean {
  if (!transport) return false;
  const body = JSON.stringify({ name: sample.name, rating: sample.rating });
  try {
    const payload = new Blob([body], { type: 'application/json' });
    if (transport.beacon(RUM_ENDPOINT, payload)) return true;
    transport.fetch(RUM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

let started = false;

/**
 * Реєструє збір пʼяти метрик. Ідемпотентно: повторний виклик (StrictMode,
 * HMR, повторний mount) не подвоює семпли. true — збір увімкнено.
 */
export function initRum(options: InitRumOptions = {}): boolean {
  if (started || !rumAllowed()) return false;
  const rate = options.rate ?? sampleRate();
  if (!shouldSample(rate, options.random ?? Math.random)) return false;
  const transport = options.transport === undefined ? browserTransport() : options.transport;
  if (!transport) return false;
  started = true;
  const report = (metric: RumSample): void => {
    sendSample(metric, transport);
  };
  onLCP(report);
  onCLS(report);
  onINP(report);
  onFCP(report);
  onTTFB(report);
  return true;
}

/** Скидання реєстрації — лише для тестів (у застосунку збір реєструється раз). */
export function resetRum(): void {
  started = false;
}
