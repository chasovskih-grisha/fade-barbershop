// MobileCrashMetrics — прийом краш-звітів застосунку (T-4443). Лічимо лише
// клас краху з підписом (appVersion, platform): «новий клас» = клас, якого ще
// не було, і саме на нього алертить T-4204. Тіло звіту мінімальне і без PII;
// невалідний семпл ігнорується без винятку (патерн WebVitalsMetrics).
import { Injectable } from '@nestjs/common';

const FIELD_LIMIT = 200;
const VERSION = /^[\w.-]{1,32}$/;
const PLATFORM = /^(ios|android)$/;

const clean = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, FIELD_LIMIT) : '';

export interface MobileCrashSignature {
  crashClass: string;
  appVersion: string;
  platform: string;
}

@Injectable()
export class MobileCrashMetrics {
  private readonly counters = new Map<string, number>();

  /** Записує звіт; повертає false, якщо семпл відкинуто як невалідний. */
  record(sample: unknown): boolean {
    try {
      const signature = this.signatureOf(sample);
      if (!signature) return false;
      const key = `${signature.crashClass}|${signature.appVersion}|${signature.platform}`;
      this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
      return true;
    } catch {
      return false;
    }
  }

  /** Знімок для /metrics: { crashClass: { version|platform: count } }. */
  snapshot(): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};
    for (const [key, value] of this.counters) {
      const [crashClass, appVersion, platform] = key.split('|');
      const bucket = (result[crashClass ?? 'other'] ??= {});
      bucket[`${appVersion ?? 'unknown'}|${platform ?? 'unknown'}`] = value;
    }
    return result;
  }

  private signatureOf(sample: unknown): MobileCrashSignature | null {
    const source = (sample ?? {}) as Record<string, unknown>;
    const crashClass = clean(source.crashClass);
    const appVersion = clean(source.appVersion);
    const platform = clean(source.platform);
    if (!crashClass || !VERSION.test(appVersion) || !PLATFORM.test(platform)) return null;
    return { crashClass, appVersion, platform };
  }
}
