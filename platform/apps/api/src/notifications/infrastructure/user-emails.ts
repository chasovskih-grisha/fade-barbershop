// Адаптер UserEmails (T-4422): читає email identity User. notifications не
// імпортує домен identity — тільки спільну схему Prisma (модульний моноліт,
// ADR 0002: контексти спілкуються подіями і схемою, не кодом).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { UserEmails } from '../application/security-alert-ports';

@Injectable()
export class PrismaUserEmails implements UserEmails {
  constructor(private readonly prisma: PrismaService) {}

  async findEmailByUserId(userId: string): Promise<string | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return row?.email ?? null;
  }
}
