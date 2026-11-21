/* eslint-disable max-lines -- cohesive module (128 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// NominatimGeocodeService — адмінський геокодер для пікера на карті (T-4405).
// Один адаптер на Nominatim: пошук адреси і reverse geocode. Політика usage —
// ≤1 запит/сек і кеш на добу; помилка провайдера не валить форму (порожній
// результат). Доменна валідація адреси лишається в Address VO: підказка може
// не мати номера будинку, адмін доповнює його вручну.

import { Injectable } from '@nestjs/common';
import type { AddressProps } from '../domain/address';

export interface GeocodeSuggestion {
  label: string;
  lat: number;
  lng: number;
  addressParts: AddressProps;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  postcode?: string;
  country_code?: string;
}

interface NominatimPlace {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
}

const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_INTERVAL_MS = 1000;
const USER_AGENT = 'fade-platform/1.0 (admin location editor)';

@Injectable()
export class NominatimGeocodeService {
  private readonly cache = new Map<string, { expiresAt: number; value: unknown }>();
  private lastRequestAt = 0;

  async search(query: string): Promise<GeocodeSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];
    const key = `search:${trimmed.toLowerCase()}`;
    const cached = this.cached<GeocodeSuggestion[]>(key);
    if (cached) return cached;

    await this.throttle();
    const url =
      'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1' +
      `&accept-language=uk&q=${encodeURIComponent(trimmed)}`;
    const body = await this.getJson(url);
    const suggestions = Array.isArray(body)
      ? body.map((place) => parseSuggestion(place as NominatimPlace)).filter(isDefined)
      : [];
    this.remember(key, suggestions);
    return suggestions;
  }

  async reverse(lat: number, lng: number): Promise<AddressProps | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const key = `reverse:${lat.toFixed(6)},${lng.toFixed(6)}`;
    const cached = this.cached<AddressProps | null>(key);
    if (cached !== undefined) return cached;

    await this.throttle();
    const url =
      'https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1' +
      `&accept-language=uk&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`;
    const body = await this.getJson(url);
    const place = (body ?? {}) as NominatimPlace;
    const parts = place.address ? toAddressParts(place.address) : null;
    this.remember(key, parts);
    return parts;
  }

  /** Тестам — фіксований час, щоб не чекати rate-limit. */
  protected now(): number {
    return Date.now();
  }

  protected wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected async getJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return (await response.json()) as unknown;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async throttle(): Promise<void> {
    const now = this.now();
    const waitFor = this.lastRequestAt + MIN_INTERVAL_MS - now;
    this.lastRequestAt = now + Math.max(0, waitFor);
    if (waitFor > 0) await this.wait(waitFor);
  }

  private cached<T>(key: string): T | undefined {
    const hit = this.cache.get(key);
    if (!hit || hit.expiresAt <= this.now()) return undefined;
    return hit.value as T;
  }

  private remember(key: string, value: unknown): void {
    this.cache.set(key, { expiresAt: this.now() + CACHE_TTL_MS, value });
  }
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

export function toAddressParts(address: NominatimAddress): AddressProps {
  const street = address.road ?? address.pedestrian ?? '';
  const city = address.city ?? address.town ?? address.village ?? address.municipality ?? '';
  const parts: AddressProps = {
    street,
    building: address.house_number ?? '',
    city,
    country: (address.country_code ?? 'ua').toUpperCase(),
  };
  if (address.postcode) parts.postalCode = address.postcode;
  return parts;
}

function parseSuggestion(place: NominatimPlace): GeocodeSuggestion | null {
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !place.address) return null;
  return {
    label: place.display_name ?? `${lat}, ${lng}`,
    lat,
    lng,
    addressParts: toAddressParts(place.address),
  };
}
