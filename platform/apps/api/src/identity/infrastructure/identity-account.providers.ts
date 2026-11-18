// Admin login + account lifecycle провайдери (T-013 / T-4411).

import type { Provider } from '@nestjs/common';
import { AdminLoginHandler } from '../application/admin-login';
import { ChangeOwnPasswordHandler } from '../application/admin-account';
import { ResetAdminPasswordHandler } from '../application/reset-admin-password';
import { SetAdminActiveHandler } from '../application/set-admin-active';
import { ListLoginAuditHandler, ListAllAdminLoginsHandler } from '../application/list-login-audit';
import { AdminAccountIO } from './admin-account.io';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { PrismaUserRepository } from './prisma-adapters';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { PrismaSessionRepository } from './prisma-session-repository';
import { PrismaLoginAudit } from './prisma-login-audit';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { useCase, type Deps } from './identity-provider.factory';

const U = PrismaUserRepository;
const S = PrismaSessionRepository;
const O = PrismaOutboxPublisher;
const CLK = SystemClock;
const IDS = UuidIdGenerator;
const UOW = PrismaUnitOfWork;
const AUD = PrismaLoginAudit;
const adminAccount = [U, S, O, CLK, IDS, UOW, AUD] as Deps;

const accountPick = (d: never[]) => ({
  users: d[0],
  sessions: d[1],
  outbox: d[2],
  clock: d[3],
  ids: d[4],
  uow: d[5],
  audit: d[6],
});

export const identityAccountProviders: Provider[] = [
  useCase(AdminLoginHandler, adminAccount, accountPick),
  useCase(ChangeOwnPasswordHandler, adminAccount, accountPick),
  useCase(ResetAdminPasswordHandler, adminAccount, accountPick),
  useCase(SetAdminActiveHandler, adminAccount, accountPick),
  {
    provide: ListLoginAuditHandler,
    useFactory: (audit: PrismaLoginAudit) => new ListLoginAuditHandler(audit),
    inject: [AUD],
  },
  {
    provide: ListAllAdminLoginsHandler,
    useFactory: (users: PrismaUserRepository, audit: PrismaLoginAudit) =>
      new ListAllAdminLoginsHandler({ listAdmins: () => users.listAdminIds() }, audit),
    inject: [U, AUD],
  },
  {
    provide: AdminAccountIO,
    useFactory: (...deps: never[]) =>
      new AdminAccountIO({
        users: deps[0] as never,
        sessions: deps[1] as never,
        outbox: deps[2] as never,
        clock: deps[3] as never,
        ids: deps[4] as never,
        uow: deps[5] as never,
        audit: deps[6] as never,
        auditReader: deps[7] as never,
        allLogins: deps[8] as never,
      }),
    inject: [U, S, O, CLK, IDS, UOW, AUD, ListLoginAuditHandler, ListAllAdminLoginsHandler],
  },
];
