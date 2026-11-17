// DTO-мапер CRM-контролера: агрегат ClientProfile серіалізується плоским
// propsData. JSON приватного поля props ламав адмінку — усі поля опинялись
// у {props:{...}}, а фронт читає їх плоско (name, phone, vipDiscountPercent).
import type { ClientProfile } from '../domain/client-profile';
import type { ClientProfileProps } from '../domain/client-profile.types';

export type ClientProfileDto = ClientProfileProps;

export function toClientDto(profile: ClientProfile): ClientProfileDto {
  return {
    ...profile.propsData,
    preferences: profile.preferences.map((p) => ({ ...p })),
    notes: profile.notes.map((n) => ({ ...n })),
  };
}
