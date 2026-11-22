import { currentTenant, requireCurrentTenant, runWithTenant, tenantFlag, tenantOverride } from './tenant-context';
import { TenantRegistry } from './tenant-registry';
import { resolveTenant, tenantIdentifierFromHost } from './tenant-resolver';
import { UnknownTenantError, type TenantConfig } from './tenant.types';

const kyiv: TenantConfig = {
  id: '11111111-1111-7111-8111-111111111111',
  slug: 'kyiv',
  schema: 'tenant_kyiv',
  overrides: { currency: 'UAH', timezone: 'Europe/Kyiv', featureFlags: { waitlist: true } },
};

const lviv: TenantConfig = {
  id: '22222222-2222-7222-8222-222222222222',
  slug: 'lviv',
  schema: 'tenant_lviv',
  overrides: { currency: 'UAH', timezone: 'Europe/Kyiv' },
};

const registry = new TenantRegistry([kyiv, lviv], kyiv.id);

describe('TenantRegistry & resolver (T-5002)', () => {
  it('resolves the tenant from an explicit header before the subdomain', () => {
    const result = resolveTenant(
      { host: 'lviv.fade.com.ua', headerTenantId: kyiv.id },
      registry
    );
    expect(result.tenant.id).toBe(kyiv.id);
    expect(result.source).toBe('header');
  });

  it('resolves a tenant subdomain and ignores reserved labels', () => {
    expect(resolveTenant({ host: 'lviv.fade.com.ua:3000' }, registry).tenant.slug).toBe('lviv');
    expect(tenantIdentifierFromHost('www.fade.com.ua')).toBeUndefined();
    expect(tenantIdentifierFromHost('fade.com.ua')).toBeUndefined();
    expect(tenantIdentifierFromHost(undefined)).toBeUndefined();
  });

  it('falls back to the default tenant and rejects unknown explicit ids', () => {
    expect(resolveTenant({ host: 'localhost:3000' }, registry)).toMatchObject({
      source: 'default',
      tenant: { id: kyiv.id },
    });
    expect(() => resolveTenant({ headerTenantId: 'nope' }, registry)).toThrow(
      UnknownTenantError
    );
  });

  it('resolves schema per tenant and never crosses tenants', () => {
    expect(registry.schemaFor('lviv')).toBe('tenant_lviv');
    expect(registry.schemaFor(kyiv.id)).toBe('tenant_kyiv');
    expect(registry.get('unknown')).toBeUndefined();
    expect(registry.size).toBe(2);
  });
});

describe('tenant async context (T-5002)', () => {
  it('scopes tenant overrides to the running call and isolates concurrent work', async () => {
    expect(currentTenant()).toBeUndefined();
    expect(() => requireCurrentTenant()).toThrow();

    const kyivView = await runWithTenant(kyiv, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return { currency: tenantOverride('currency'), waitlist: tenantFlag('waitlist') };
    });
    const lvivView = await runWithTenant(lviv, async () => ({
      currency: tenantOverride('currency'),
      waitlist: tenantFlag('waitlist'),
    }));

    expect(kyivView).toEqual({ currency: 'UAH', waitlist: true });
    expect(lvivView).toEqual({ currency: 'UAH', waitlist: false });
    expect(currentTenant()).toBeUndefined();
  });
});
