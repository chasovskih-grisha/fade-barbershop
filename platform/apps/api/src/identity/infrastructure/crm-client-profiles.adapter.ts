// Адаптер порту ClientProfilesPort (identity) на crm-репозиторій: identity не
// імпортує crm-хендлери й не пише картки сам — лише через цей порт (ADR 0017:
// контексти розділені, інтеграція — на рівні infra збірки моноліту).
import { Injectable } from '@nestjs/common';
import { PrismaClientProfileRepository } from '../../crm/infrastructure/prisma-client-profile.repository';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { createClientProfile } from '../../crm/domain/client-profile.types';
import type { ClientProfilesPort } from '../application/admin-onboard-client';

@Injectable()
export class CrmClientProfilesAdapter implements ClientProfilesPort {
  constructor(private readonly profiles: PrismaClientProfileRepository) {}

  async createForUser(input: {
    userId: string;
    phone: string;
    name: string | null;
  }): Promise<void> {
    const { profile } = createClientProfile(
      { userId: input.userId, phone: input.phone, name: input.name },
      new SystemClock(),
      new UuidIdGenerator()
    );
    await this.profiles.save(profile); // upsert за id — ідемпотентно
  }
}
