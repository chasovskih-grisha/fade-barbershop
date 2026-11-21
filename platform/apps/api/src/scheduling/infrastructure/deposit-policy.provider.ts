import { DepositPolicy } from '../domain/deposit-terms';
import { defaultDepositPolicy } from '../application/deposit-policy';

/** Deposit policy provider for T-197 waitlist deposit flow.
 * Provides the deposit policy via the deps.get() pattern used by book-appointment.use-case.
 */
export const DepositPolicyProvider = {
  get: async (): Promise<DepositPolicy> => {
    return defaultDepositPolicy;
  },
};
