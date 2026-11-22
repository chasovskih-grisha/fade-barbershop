/** Tenant identity and per-tenant configuration overrides (T-5002). */

export interface TenantOverrides {
  readonly timezone?: string;
  readonly currency?: string;
  readonly locale?: string;
  readonly featureFlags?: Readonly<Record<string, boolean>>;
}

export interface TenantConfig {
  readonly id: string;
  readonly slug: string;
  /** Physical PostgreSQL schema or row-level-security scope for this tenant. */
  readonly schema: string;
  readonly overrides: TenantOverrides;
}

/** Raw request facts used to resolve a tenant, independent of the HTTP framework. */
export interface TenantRequest {
  readonly host?: string | undefined;
  readonly headerTenantId?: string | undefined;
}

export type TenantResolutionSource = 'header' | 'subdomain' | 'default';

export interface ResolvedTenant {
  readonly tenant: TenantConfig;
  readonly source: TenantResolutionSource;
}

export class UnknownTenantError extends Error {
  constructor(readonly identifier: string) {
    super(`Unknown tenant: ${identifier}`);
    this.name = 'UnknownTenantError';
  }
}
