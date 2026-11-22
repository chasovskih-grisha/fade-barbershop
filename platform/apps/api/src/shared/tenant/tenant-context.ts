import { AsyncLocalStorage } from 'node:async_hooks';
import type { TenantConfig, TenantOverrides } from './tenant.types';

const storage = new AsyncLocalStorage<TenantConfig>();

/** Runs a request (or job) with its tenant bound to the async context. */
export function runWithTenant<T>(tenant: TenantConfig, fn: () => T): T {
  return storage.run(tenant, fn);
}

export function currentTenant(): TenantConfig | undefined {
  return storage.getStore();
}

export function requireCurrentTenant(): TenantConfig {
  const tenant = storage.getStore();
  if (!tenant) throw new Error('No tenant bound to the async context');
  return tenant;
}

/** Tenant override (`currency`, `timezone`, feature flag) with no tenant → undefined. */
export function tenantOverride<K extends keyof TenantOverrides>(
  key: K
): TenantOverrides[K] | undefined {
  return storage.getStore()?.overrides[key];
}

/** Feature flags are opt-in: an absent flag or tenant reads as disabled. */
export function tenantFlag(name: string): boolean {
  return storage.getStore()?.overrides.featureFlags?.[name] === true;
}
