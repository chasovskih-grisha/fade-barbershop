import { Referral, ReferralCode } from '../domain/referral.entity';

export interface ReferralRepository {
  saveCode(referralCode: ReferralCode): Promise<void>;
  findCodeByCode(code: string): Promise<ReferralCode | null>;
  findCodeByClientId(clientId: string): Promise<ReferralCode | null>;
  
  save(referral: Referral): Promise<void>;
  findById(id: string): Promise<Referral | null>;
  findByReferredId(referredId: string): Promise<Referral | null>;
  findByReferrerId(referrerId: string): Promise<Referral[]>;
  findAll(): Promise<Referral[]>;
}
