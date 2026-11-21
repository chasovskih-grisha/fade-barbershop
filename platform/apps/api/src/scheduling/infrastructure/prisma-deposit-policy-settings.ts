// PrismaDepositPolicySettings — порт DepositPolicySettingsPort на AppSetting
// (патерн PrismaGeocoderSettings / PrismaBookingConfirmationSettings).
// Пошкоджений JSON деградує до дефолтів PAY-ADM-09, ніколи не кидає; короткий
// кеш робить зміну з адмінки чинною протягом секунди без запиту на кожен запис.
// T-4444: кожна зміна правил пише рядок історії з новою версією.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { DEFAULT_DEPOSIT_POLICY, type DepositPolicy } from '../domain/deposit-terms';
import {
  DEFAULT_POLICY_VERSION,
  DEPOSIT_POLICY_SETTING_KEY,
  parseDepositPolicySettings,
  parsePolicyVersion,
  sameDepositPolicy,
  type DepositPolicySettingsPort,
  type DepositPolicyVersionRow,
  type VersionedDepositPolicy,
} from '../domain/deposit-policy-settings';

const READ_CACHE_MS = 1000;
const HISTORY_LIMIT = 20;

@Injectable()
export class PrismaDepositPolicySettings implements DepositPolicySettingsPort {
  private cachedAt = 0;
  private cached: DepositPolicy = DEFAULT_DEPOSIT_POLICY;
  private cachedVersion = DEFAULT_POLICY_VERSION;

  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<DepositPolicy> {
    await this.refresh();
    return this.cached;
  }

  async getVersioned(): Promise<VersionedDepositPolicy> {
    await this.refresh();
    return { ...this.cached, version: this.cachedVersion };
  }

  async history(limit = HISTORY_LIMIT): Promise<DepositPolicyVersionRow[]> {
    const rows = await this.prisma.depositPolicyVersion.findMany({
      orderBy: { version: 'desc' },
      take: limit,
    });
    return rows.map((row) => ({
      version: row.version,
      percent: row.percent,
      rounding: row.rounding,
      cancellationWindowHours: row.cancellationWindowHours,
      createdAt: row.createdAt,
      createdBy: row.createdBy,
    }));
  }

  /**
   * Запис правил. Незмінена політика версію не рухає (і не плодить історію);
   * змінена — створює версію N+1 і снепшот рядка історії в тій самій транзакції.
   */
  async set(policy: DepositPolicy, createdBy?: string): Promise<VersionedDepositPolicy> {
    const current = await this.getVersioned();
    if (sameDepositPolicy(current, policy)) return current;
    const version = current.version + 1;
    const value = { ...policy, version };
    await this.prisma.$transaction(async (tx) => {
      await tx.depositPolicyVersion.create({
        data: { id: uuidv7(), version, ...policy, createdBy: createdBy ?? null },
      });
      await tx.appSetting.upsert({
        where: { key: DEPOSIT_POLICY_SETTING_KEY },
        create: { key: DEPOSIT_POLICY_SETTING_KEY, value },
        update: { value },
      });
    });
    this.remember(policy, version);
    return value;
  }

  /** Читання з кешем; збій БД лишає дефолти й версію 1. */
  private async refresh(): Promise<void> {
    const now = Date.now();
    if (now - this.cachedAt < READ_CACHE_MS) return;
    try {
      const row = await this.prisma.appSetting.findUnique({
        where: { key: DEPOSIT_POLICY_SETTING_KEY },
      });
      this.remember(parseDepositPolicySettings(row?.value ?? null), parsePolicyVersion(row?.value));
    } catch {
      this.remember(DEFAULT_DEPOSIT_POLICY, DEFAULT_POLICY_VERSION);
    }
    this.cachedAt = now;
  }

  private remember(policy: DepositPolicy, version: number): void {
    this.cached = policy;
    this.cachedVersion = version;
    this.cachedAt = Date.now();
  }
}
