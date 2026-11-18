// Поточна політика депозиту мережі (PAY-ADM-09). Значення читаються з налаштувань
// адміністратора; тут — дефолт, яким користуються use cases, коли провайдер
// налаштувань не переданий.
import { DEFAULT_DEPOSIT_POLICY, type DepositPolicy } from '../domain/deposit-terms';

export type { DepositPolicy };

export const depositPolicy: DepositPolicy = DEFAULT_DEPOSIT_POLICY;
