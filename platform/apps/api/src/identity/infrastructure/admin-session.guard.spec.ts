import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminSessionGuard } from './admin-session.guard';
import { SESSION_COOKIE_NAME } from './session-cookie';
import { uuidv7 } from '@fade/domain-shared';

const ADMIN_ID = uuidv7();

const activeAdmin = { id: ADMIN_ID, role: 'admin', active: true };
const session = { revokedAt: null, channel: 'admin', userId: ADMIN_ID };
function context(
  path: string,
  token?: string
): ExecutionContext & {
  request: { path: string; cookies: Record<string, string>; adminUserId?: string };
} {
  const request = { path, cookies: token ? { [SESSION_COOKIE_NAME]: token } : {} };
  return {
    request,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext & { request: typeof request };
}

describe('AdminSessionGuard', () => {
  const sessions = { findByTokenHash: jest.fn() };
  const users = { findById: jest.fn() };
  const guard = new AdminSessionGuard(sessions as never, users as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows public admin authentication endpoints', async () => {
    await expect(guard.canActivate(context('/admin/auth/login'))).resolves.toBe(true);
    expect(sessions.findByTokenHash).not.toHaveBeenCalled();
  });

  it('rejects missing, revoked, and non-admin sessions', async () => {
    await expect(guard.canActivate(context('/admin/barbers'))).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    sessions.findByTokenHash.mockResolvedValueOnce({ ...session, revokedAt: new Date() });
    await expect(guard.canActivate(context('/admin/barbers', 'revoked'))).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    sessions.findByTokenHash.mockResolvedValueOnce({ ...session, channel: 'web' });
    await expect(guard.canActivate(context('/admin/barbers', 'web'))).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it('requires an active admin account for protected routes', async () => {
    sessions.findByTokenHash.mockResolvedValue(session);
    users.findById.mockResolvedValue({ ...activeAdmin, active: false });
    await expect(guard.canActivate(context('/admin/barbers', 'valid'))).rejects.toBeInstanceOf(
      ForbiddenException
    );
    users.findById.mockResolvedValue(activeAdmin);
    const ctx = context('/admin/barbers', 'valid');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.request.adminUserId).toBe(ADMIN_ID);
  });
});
