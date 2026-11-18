// Адаптери стирання (T-4805): OTP перевіряється тим самим доменним
// challenge-ом, що й вхід (без дублювання правил); обʼєкти видаляє MinIO/S3
// через наявний S3PhotoStorage (ADR 0018).
import { Injectable } from '@nestjs/common';
import { S3PhotoStorage } from '../../../haircut-ai/infrastructure/s3-photo-storage';
import { PrismaOtpChallengeRepository } from '../../infrastructure/prisma-otp-challenge-repository';
import type { ErasureObjectStore, ErasureOtpVerifier } from '../application/erasure.ports';

@Injectable()
export class OtpChallengeVerifier implements ErasureOtpVerifier {
  constructor(private readonly challenges: PrismaOtpChallengeRepository) {}

  async verify(phone: string, code: string, now: Date): Promise<boolean> {
    const challenge = await this.challenges.findLastByPhone(phone);
    if (!challenge || challenge.purpose !== 'login') return false;
    const result = challenge.verify(now, code);
    await this.challenges.save(challenge);
    return result === 'ok';
  }
}

@Injectable()
export class S3ErasureObjects implements ErasureObjectStore {
  constructor(private readonly storage: S3PhotoStorage) {}

  async remove(objectKeys: readonly string[]): Promise<void> {
    if (objectKeys.length === 0) return;
    await this.storage.remove(objectKeys);
  }
}
