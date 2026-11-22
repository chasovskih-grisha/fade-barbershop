import { UnknownTenantError, type TenantConfig } from './tenant.types';

/** In-memory tenant catalogue; the production adapter loads it from the DB. */
export class TenantRegistry {
  private readonly byId = new Map<string, TenantConfig>();
  private readonly bySlug = new Map<string, TenantConfig>();

  constructor(
    tenants: readonly TenantConfig[],
    private readonly defaultTenantId?: string
  ) {
    for (const tenant of tenants) {
      this.byId.set(tenant.id, tenant);
      this.bySlug.set(tenant.slug, tenant);
    }
  }

  get size(): number {
    return this.byId.size;
  }

  get(id: string): TenantConfig | undefined {
    return this.byId.get(id);
  }

  findBySlug(slug: string): TenantConfig | undefined {
    return this.bySlug.get(slug);
  }

  get default(): TenantConfig | undefined {
    return this.defaultTenantId ? this.byId.get(this.defaultTenantId) : undefined;
  }

  /** Canonical id wins over slug so an id can never be shadowed by a slug. */
  resolve(identifier: string): TenantConfig {
    const tenant = this.byId.get(identifier) ?? this.bySlug.get(identifier);
    if (!tenant) throw new UnknownTenantError(identifier);
    return tenant;
  }

  schemaFor(identifier: string): string {
    return this.resolve(identifier).schema;
  }
}
