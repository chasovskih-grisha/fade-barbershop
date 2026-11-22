import type { TenantRegistry } from './tenant-registry';
import {
  UnknownTenantError,
  type ResolvedTenant,
  type TenantRequest,
} from './tenant.types';

/** Infrastructure labels that must never be read as a tenant slug. */
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'app', 'shop']);

/** Second-level labels under a country TLD, e.g. the `com` of `fade.com.ua`. */
const SECOND_LEVEL_SUFFIXES = new Set(['com', 'co', 'org', 'net', 'gov', 'edu', 'ac']);

/** Number of labels that form the registrable base domain. */
function baseDomainLabels(labels: readonly string[]): number {
  const tld = labels[labels.length - 1];
  const secondLevel = labels[labels.length - 2];
  const multiPartTld = tld?.length === 2 && secondLevel !== undefined && SECOND_LEVEL_SUFFIXES.has(secondLevel);
  return multiPartTld ? 3 : 2;
}

/** `<slug>.fade.com.ua` → `slug`; bare hosts and reserved labels → undefined. */
export function tenantIdentifierFromHost(host: string | undefined): string | undefined {
  if (!host) return undefined;
  const hostname = host.split(':')[0] ?? '';
  const labels = hostname.toLowerCase().split('.').filter(Boolean);
  const base = baseDomainLabels(labels);
  if (labels.length <= base) return undefined;
  const candidate = labels[labels.length - base - 1];
  return candidate && !RESERVED_SUBDOMAINS.has(candidate) ? candidate : undefined;
}

/**
 * Header beats subdomain; both beat the configured default tenant.
 * Throws `UnknownTenantError` when an explicit identifier is unknown.
 */
export function resolveTenant(
  request: TenantRequest,
  registry: TenantRegistry
): ResolvedTenant {
  if (request.headerTenantId) {
    return { tenant: registry.resolve(request.headerTenantId), source: 'header' };
  }
  const slug = tenantIdentifierFromHost(request.host);
  if (slug) {
    return { tenant: registry.resolve(slug), source: 'subdomain' };
  }
  const fallback = registry.default;
  if (!fallback) throw new UnknownTenantError('default');
  return { tenant: fallback, source: 'default' };
}
