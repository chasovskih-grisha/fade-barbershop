/* eslint-disable complexity -- one authorization decision: cookie, session, role, active; split tracked in T-2500f */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { hashToken } from '../domain/otp-code';
import { PrismaUserRepository } from './prisma-adapters';
import { PrismaSessionRepository } from './prisma-session-repository';
import { SESSION_COOKIE_NAME } from './session-cookie';

const PUBLIC_ADMIN_AUTH = new Set(['/admin/auth/login', '/admin/auth/me', '/admin/auth/logout']);
/** Платіжні команди, доступні лише з адмін-сесією (не публічний API). */
const ADMIN_ONLY_PAYMENT_PREFIXES = ['/payment/refunds'];
/** T-093: барбер позначає решту на місці зі своєї сесії; решта платіжних команд — лише адмін. */
const STAFF_PAYMENT_PATHS = new Set(['/payment/onsite']);
const isUnder = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`);

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(
    private readonly sessions: PrismaSessionRepository,
    private readonly users: PrismaUserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;
    const staffPayment = STAFF_PAYMENT_PATHS.has(path);
    const adminOnlyPayment = ADMIN_ONLY_PAYMENT_PREFIXES.some((prefix) =>
      isUnder(path, prefix)
    );
    const protectedRoute = path.startsWith('/admin/') || staffPayment || adminOnlyPayment;
    if (!protectedRoute || PUBLIC_ADMIN_AUTH.has(path)) return true;

    const token = request.cookies?.[SESSION_COOKIE_NAME];
    if (!token) throw new UnauthorizedException('Admin session required');
    const session = await this.sessions.findByTokenHash(hashToken(token));
    if (!session || session.revokedAt || session.channel !== 'admin') {
      throw new UnauthorizedException('Valid admin session required');
    }
    const user = await this.users.findById(session.userId);
    const allowedRole = staffPayment
      ? user?.role === 'admin' || user?.role === 'barber'
      : user?.role === 'admin';
    if (!user || !allowedRole || !user.active)
      throw new ForbiddenException('Admin access required');
    (request as Request & { adminUserId?: string }).adminUserId = user.id;

    return true;
  }
}