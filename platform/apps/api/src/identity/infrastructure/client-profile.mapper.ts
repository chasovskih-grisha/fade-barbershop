import type { ClientProfileDto } from '../../crm/infrastructure/client-profile.dto';
import type { ClientProfileResult } from '@fade/contracts';

export function toProfileResult(dto: ClientProfileDto): ClientProfileResult {
  return {
    id: dto.id,
    userId: dto.userId,
    name: dto.name,
    phone: dto.phone,
    preferences: dto.preferences.map((p) => ({
      id: p.id,
      text: p.text,
      createdAt: p.createdAt.toISOString(),
    })),
    birthday: dto.birthday ?? null,
    vipDiscountPercent: dto.vipDiscountPercent,
    loyaltyVisitsCount: dto.loyaltyVisitsCount,
    createdAt: dto.createdAt.toISOString(),
    updatedAt: dto.updatedAt.toISOString(),
  };
}
