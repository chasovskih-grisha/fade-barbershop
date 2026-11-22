import type { NextFunction, Request, Response } from 'express';
import { runWithTenant } from './tenant-context';
import type { TenantRegistry } from './tenant-registry';
import { resolveTenant } from './tenant-resolver';

function headerTenantId(request: Request): string | undefined {
  const value = request.headers['x-tenant-id'];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Binds the request tenant for the rest of the middleware chain and echoes the
 * resolved identity so clients and logs can see which tenant served them.
 */
export function createTenantMiddleware(registry: TenantRegistry) {
  return function tenantMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
  ): void {
    try {
      const resolved = resolveTenant(
        { host: request.headers.host, headerTenantId: headerTenantId(request) },
        registry
      );
      response.setHeader('x-tenant-id', resolved.tenant.id);
      response.setHeader('x-tenant-source', resolved.source);
      runWithTenant(resolved.tenant, next);
    } catch {
      response.status(400).json({ error: 'unknown_tenant' });
    }
  };
}
