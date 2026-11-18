import { ReferralCode, Referral } from '../domain/referral.entity';
import type { ReferralRepository } from './referral.repository';

export class InMemoryReferralRepository implements ReferralRepository {
  private codes = new Map<string, ReferralCode>();
  private codeByClient = new Map<string, ReferralCode>();
  private referrals = new Map<string, Referral>();

  async saveCode(referralCode: ReferralCode): Promise<void> {
    this.codes.set(referralCode.code, referralCode);
    this.codeByClient.set(referralCode.clientId, referralCode);
  }

  async findCodeByCode(code: string): Promise<ReferralCode | null> {
    return this.codes.get(code) ?? null;
  }

  async findCodeByClientId(clientId: string): Promise<ReferralCode | null> {
    return this.codeByClient.get(clientId) ?? null;
  }

  async save(referral: Referral): Promise<void> {
    this.referrals.set(referral.id, referral);
  }

  async findById(id: string): Promise<Referral | null> {
    return this.referrals.get(id) ?? null;
  }

  async findByReferredId(referredId: string): Promise<Referral | null> {
    for (const ref of this.referrals.values()) {
      if (ref.referredId === referredId) return ref;
    }
    return null;
  }

  async findByReferrerId(referrerId: string): Promise<Referral[]> {
    const result: Referral[] = [];
    for (const ref of this.referrals.values()) {
      if (ref.referrerId === referrerId) result.push(ref);
    }
    return result;
  }

  async findAll(): Promise<Referral[]> {
    return Array.from(this.referrals.values());
  }
}
