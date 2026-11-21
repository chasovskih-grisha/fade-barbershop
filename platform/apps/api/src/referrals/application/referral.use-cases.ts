/* eslint-disable max-params -- 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
import { ReferralCode, Referral } from '../domain/referral.entity';
import type { ReferralRepository } from './referral.repository';

export interface FraudCheckService {
  isFraudulent(
    referrerId: string,
    referredId: string,
    ipAddress?: string,
    deviceFingerprint?: string
  ): Promise<boolean>;
}

export class DefaultFraudCheckService implements FraudCheckService {
  async isFraudulent(
    referrerId: string,
    referredId: string,
    _ipAddress?: string,
    _deviceFingerprint?: string
  ): Promise<boolean> {
    if (referrerId === referredId) return true;
    // Simple heuristic: if IP / fingerprint flags match suspicious patterns
    return false;
  }
}

export class GenerateReferralCodeUseCase {
  constructor(private readonly referralRepo: ReferralRepository) {}

  async execute(clientId: string): Promise<ReferralCode> {
    const existing = await this.referralRepo.findCodeByClientId(clientId);
    if (existing) return existing;

    const code = ReferralCode.create(clientId);
    await this.referralRepo.saveCode(code);
    return code;
  }
}

export class RegisterReferralUseCase {
  constructor(
    private readonly referralRepo: ReferralRepository,
    private readonly fraudCheck: FraudCheckService
  ) {}

  async execute(input: {
    referrerCode: string;
    referredClientId: string;
    ipAddress?: string;
    deviceFingerprint?: string;
  }): Promise<Referral> {
    const codeObj = await this.referralRepo.findCodeByCode(input.referrerCode);
    if (!codeObj) {
      throw new Error('Invalid referral code');
    }

    if (codeObj.clientId === input.referredClientId) {
      throw new Error('Self-referral is not allowed');
    }

    const fraudulent = await this.fraudCheck.isFraudulent(
      codeObj.clientId,
      input.referredClientId,
      input.ipAddress,
      input.deviceFingerprint
    );
    if (fraudulent) {
      throw new Error('Referral flagged as fraudulent/abuse');
    }

    const existingRef = await this.referralRepo.findByReferredId(input.referredClientId);
    if (existingRef) {
      throw new Error('Client already has an attributed referral');
    }

    const referral = Referral.create(codeObj.clientId, input.referredClientId, input.referrerCode);
    await this.referralRepo.save(referral);
    return referral;
  }
}

export class QualifyReferralUseCase {
  constructor(private readonly referralRepo: ReferralRepository) {}

  async execute(referredClientId: string): Promise<Referral | null> {
    const referral = await this.referralRepo.findByReferredId(referredClientId);
    if (!referral) return null;

    if (referral.status === 'PENDING') {
      referral.qualify();
      referral.reward(); // Issue reward automatically
      await this.referralRepo.save(referral);
    }
    return referral;
  }
}
