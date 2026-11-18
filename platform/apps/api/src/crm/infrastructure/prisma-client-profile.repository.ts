import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientProfile } from '../domain/client-profile';
import { ClientProfileRepository, type ClientProfileListFilters } from '../domain/client-profile.repository';
import { toDomainProfile, toPrismaProfile } from './client-profile-row';

// Тонкий адаптер порту ClientProfileRepository: мапінг рядка — у
// client-profile-row.ts, транзакційний клієнт — через PrismaService.
@Injectable()
export class PrismaClientProfileRepository implements ClientProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ClientProfile | null> {
    const data = await this.prisma.clientProfile.findUnique({ where: { id } });
    return data ? toDomainProfile(data as never) : null;
  }

  async findByUserId(userId: string): Promise<ClientProfile | null> {
    const data = await this.prisma.clientProfile.findUnique({ where: { userId } });
    return data ? toDomainProfile(data as never) : null;
  }

  async findByPhone(phone: string): Promise<ClientProfile | null> {
    const data = await this.prisma.clientProfile.findUnique({ where: { phone } });
    return data ? toDomainProfile(data as never) : null;
  }

  async save(profile: ClientProfile): Promise<void> {
    const props = profile.propsData;
    await this.prisma.clientProfile.upsert({
      where: { id: props.id },
      create: toPrismaProfile(props),
      update: toPrismaProfile(props),
    });
  }

  async list(filters?: ClientProfileListFilters): Promise<ClientProfile[]> {
    const { search, limit = 20, offset = 0 } = filters ?? {};
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            // userId — uuid-колонка (T-4300b): підрядковий пошук неможливий, лише точний збіг.
            { userId: search },
          ],
        }
      : {};
    const data = await this.prisma.clientProfile.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((row) => toDomainProfile(row as never));
  }
}
