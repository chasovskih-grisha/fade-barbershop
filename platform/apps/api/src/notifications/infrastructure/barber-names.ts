// Ім'я барбера для push (T-4616b): перенесення на іншого майстра називає його.
// barberId — контекстне посилання на identity (User.id, без FK), тож лукап
// один: User.name. Порожнє/відсутнє ім'я — null, і текст лишається без нього.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface BarberNames {
  findName(barberId: string): Promise<string | null>;
}

@Injectable()
export class PrismaBarberNames implements BarberNames {
  constructor(private readonly prisma: PrismaService) {}

  async findName(barberId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: barberId },
      select: { name: true },
    });
    return user?.name?.trim() || null;
  }
}
