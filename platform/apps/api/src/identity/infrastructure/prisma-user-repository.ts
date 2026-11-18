// Prisma-адаптер репозиторію User. Методи працюють з активним
// tx-клієнтом (currentDb) у транзакції PrismaUnitOfWork, інакше — базовим.

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { isRole, type Role } from '../domain/role';
import type { UserRepository } from '../domain/ports';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { WaitlistEntryDto } from '../../booking/dto/waitlist-entry.dto';

interface UserRow {
  id: string;
  phone: string;
  role: string;
  name: string | null;
  email: string | null;
  active: boolean;
  selfSchedule: boolean;
  username: string | null;
  passwordHash: string | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  private readonly waitlist = new Map<string, WaitlistEntryDto>();

  constructor(private readonly prisma: PrismaService) {}
  private db() {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db().user.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }
  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.db().user.findUnique({ where: { phone } });
    return row ? this.map(row) : null;
  }
  async findByUsername(username: string): Promise<User | null> {
    const row = await this.db().user.findUnique({ where: { username } });
    return row ? this.map(row) : null;
  }
  async listByRole(role: Role): Promise<User[]> {
    const rows = await this.db().user.findMany({ where: { role } });
    return rows.map((row) => this.map(row));
  }

  /** T-4422: хтось уже зайняв цю email-адресу? */
  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db().user.findUnique({ where: { email } });
    return row ? this.map(row) : null;
  }

  /** Легкий список id адмінів (для owner-подання журналу входів, T-4411). */
  async listAdminIds(): Promise<string[]> {
    const rows = await this.db().user.findMany({ where: { role: 'admin' }, select: { id: true } });
    return rows.map((r) => r.id);
  }

  async save(user: User): Promise<void> {
    const data = {
      phone: user.phone.value,
      role: user.role,
      name: user.name,
      email: user.email,
      active: user.active,
      selfSchedule: user.selfSchedule,
      username: user.username ?? null,
      passwordHash: user.passwordHash ?? null,
      phoneVerifiedAt: user.phoneVerifiedAt,
    };
    await this.db().user.upsert({
      where: { id: user.id },
      create: { id: user.id, ...data },
      update: data,
    });
  }

  // T-053h waitlist integration
  async findActiveClient(): Promise<User | null> {
    const rows = await this.db().user.findMany({ where: { active: true, role: 'client' } });
    const row = rows[0];
    return row ? this.map(row) : null;
  }
  async addWaitlistEntry(entry: WaitlistEntryDto): Promise<void> {
    this.waitlist.set(entry.id, entry);
  }
  async removeWaitlistEntry(entryId: string): Promise<void> {
    this.waitlist.delete(entryId);
  }
  async listWaitingEntries(filters: {
    status: string;
    locationId?: string;
    serviceId?: string;
    barberId?: string;
  }): Promise<WaitlistEntryDto[]> {
    return [...this.waitlist.values()].filter((entry) => {
      if (entry.status !== filters.status) return false;
      if (filters.locationId && entry.locationId !== filters.locationId) return false;
      if (filters.serviceId && entry.serviceId !== filters.serviceId) return false;
      if (filters.barberId && entry.barberId !== filters.barberId) return false;
      return true;
    });
  }
  private map(row: UserRow): User {
    return User.create({
      id: row.id,
      phone: PhoneNumber.of(row.phone),
      role: isRole(row.role) ? row.role : 'client',
      name: row.name,
      email: row.email,
      active: row.active,
      selfSchedule: row.selfSchedule,
      username: row.username,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
      phoneVerifiedAt: row.phoneVerifiedAt,
    });
  }
}
