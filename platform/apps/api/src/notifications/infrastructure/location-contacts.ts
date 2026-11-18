// Контакти локації на Prisma (T-4608): email у Location існує з T-021
// (MNG-ADM-01). Коли в CRM-профілі з'явиться email клієнта, одержувач листа
// змінюється тут — контракт application не рухається.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PrismaLocationContacts {
  constructor(private readonly prisma: PrismaService) {}

  async findContacts(locationId: string): Promise<{ name: string; email: string | null } | null> {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      select: { name: true, email: true },
    });
    return location ? { name: location.name, email: location.email } : null;
  }
}
