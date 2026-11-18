// Prisma-адаптер репозиторію OtpChallenge. tx через currentDb / базовий клієнт.

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { OtpChallenge } from '../domain/otp-challenge';
import type { OtpPurpose } from '../domain/otp-challenge.data';
import type { OtpChallengeRepository } from '../domain/ports';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';

function asPurpose(value: string): OtpPurpose {
  return value === 'booking' || value === 'phone_change' ? value : 'login';
}

@Injectable()
export class PrismaOtpChallengeRepository implements OtpChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}
  private db() {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async findLastByPhone(phone: string): Promise<OtpChallenge | null> {
    const row = await this.db().otpChallenge.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });
    return row
      ? OtpChallenge.reconstitute({
          id: row.id,
          phone: row.phone,
          codeHash: row.codeHash,
          purpose: asPurpose((row as any).purpose ?? 'LOGIN'),
          expiresAt: row.expiresAt,
          resendAfter: row.resendAfter,
          attempts: row.attempts,
          lockedUntil: row.lockedUntil,
          usedAt: row.usedAt,
          createdAt: row.createdAt,
        })
      : null;
  }

  async save(challenge: OtpChallenge): Promise<void> {
    const data = {
      id: challenge.id,
      phone: challenge.phone,
      codeHash: challenge.codeHash,
      purpose: challenge.purpose,
      expiresAt: challenge.expiresAt,
      resendAfter: challenge.resendAfter,
      attempts: challenge.attempts,
      lockedUntil: challenge.lockedUntil,
      usedAt: challenge.usedAt,
    };
    await this.db().otpChallenge.upsert({
      where: { id: challenge.id },
      create: data,
      update: {
        attempts: challenge.attempts,
        lockedUntil: challenge.lockedUntil,
        usedAt: challenge.usedAt,
      },
    });
  }
}
