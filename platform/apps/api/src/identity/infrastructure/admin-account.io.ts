// Bundle обробників життєвого циклу адмін-обліковки (T-4411) — окремо від
// контролера (max-lines / max-params).
import { Injectable } from '@nestjs/common';
import { ChangeOwnPasswordHandler, type AdminAccountDeps } from '../application/admin-account';
import { ResetAdminPasswordHandler } from '../application/reset-admin-password';
import { SetAdminActiveHandler } from '../application/set-admin-active';
import { ListAllAdminLoginsHandler, ListLoginAuditHandler } from '../application/list-login-audit';

@Injectable()
export class AdminAccountIO {
  constructor(
    readonly deps: AdminAccountDeps & {
      auditReader: ListLoginAuditHandler;
      allLogins: ListAllAdminLoginsHandler;
    }
  ) {
    this.changeOwn = new ChangeOwnPasswordHandler(deps);
    this.reset = new ResetAdminPasswordHandler(deps);
    this.active = new SetAdminActiveHandler(deps);
    this.audit = deps.auditReader;
    this.allLogins = deps.allLogins;
  }
  readonly changeOwn: ChangeOwnPasswordHandler;
  readonly reset: ResetAdminPasswordHandler;
  readonly active: SetAdminActiveHandler;
  readonly audit: ListLoginAuditHandler;
  readonly allLogins: ListAllAdminLoginsHandler;
}
