// In-process реалізації сховищ геокодера: Map-кеш, ковзне вікно лімітів і
// лічильник збоїв із надгробком. Семантика ідентична попередній версії
// декоратора; Redis-адаптер (ADR 0050) реалізує ті самі три інтерфейси.

import { Injectable } from '@nestjs/common';
import type {
  CachedCity,
  GeocoderCacheStore,
  GeocoderRateLimitStore,
  GeocoderTombstoneStore,
} from '../domain/geocoder-stores';

const CACHE_MAX_ENTRIES = 10_000;

@Injectable()
export class LocalGeocoderCacheStore implements GeocoderCacheStore {
  private readonly map = new Map<string, CachedCity>();

  async get(key: string): Promise<CachedCity | null> {
    const entry = this.map.get(key);
    return entry ?? null;
  }

  async set(key: string, value: CachedCity): Promise<void> {
    this.map.set(key, value);
    if (this.map.size > CACHE_MAX_ENTRIES) {
      let oldestKey = '';
      let oldestAt = Infinity;
      for (const [k, e] of this.map) {
        if (e.expiresAt < oldestAt) {
          oldestAt = e.expiresAt;
          oldestKey = k;
        }
      }
      if (oldestKey) this.map.delete(oldestKey);
    }
  }
}

@Injectable()
export class LocalGeocoderRateLimitStore implements GeocoderRateLimitStore {
  private readonly calls = new Map<string, number[]>();

  async tryAcquire(input: {
    key: string;
    max: number;
    windowMs: number;
    nowMs: number;
  }): Promise<boolean> {
    const window = (this.calls.get(input.key) ?? []).filter(
      (ts) => input.nowMs - ts < input.windowMs
    );
    if (window.length >= input.max) {
      this.calls.set(input.key, window);
      return false;
    }
    window.push(input.nowMs);
    this.calls.set(input.key, window);
    return true;
  }
}

@Injectable()
export class LocalGeocoderTombstoneStore implements GeocoderTombstoneStore {
  private readonly failures = new Map<string, number>();
  private readonly until = new Map<string, number>();

  async isTombstoned(key: string, nowMs: number): Promise<boolean> {
    return (this.until.get(key) ?? 0) > nowMs;
  }

  async recordFailure(input: {
    key: string;
    nowMs: number;
    threshold: number;
    durationMs: number;
  }): Promise<void> {
    const count = (this.failures.get(input.key) ?? 0) + 1;
    if (count >= input.threshold) {
      this.until.set(input.key, input.nowMs + input.durationMs);
      this.failures.delete(input.key);
    } else {
      this.failures.set(input.key, count);
    }
  }

  async recordSuccess(key: string): Promise<void> {
    this.failures.delete(key);
  }
}
