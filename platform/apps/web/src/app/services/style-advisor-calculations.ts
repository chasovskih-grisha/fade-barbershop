import type { Service } from '@/lib/api/catalog';

export type HairType = 'classic' | 'fade' | 'long' | 'beard';
export type Urgency = 'express' | 'standard' | 'luxury';

export const HAIR_TYPES: Array<{ id: HairType; label: string; desc: string }> = [
  { id: 'fade', label: 'Fade / Crop', desc: 'Сучасні текстури' },
  { id: 'classic', label: 'Класика', desc: 'Діловий стиль' },
  { id: 'long', label: 'Подовжена', desc: 'Свобода форми' },
  { id: 'beard', label: 'Тільки борода', desc: 'Догляд & форма' },
];

export const URGENCIES: Array<{ id: Urgency; label: string; time: string }> = [
  { id: 'express', label: '⚡ Експрес', time: '~40 хв' },
  { id: 'standard', label: '☕ Стандарт', time: '~60 хв' },
  { id: 'luxury', label: '👑 Королівський', time: '~90 хв' },
];

/** The current heuristic is a simple preview of the first three services. */
export function recommendServices(services: Service[]): Service[] {
  return services.slice(0, 3);
}

export function calculateSetTotals(
  recommended: Service[],
  includeBeard: boolean,
  hairType: HairType
): { totalPrice: number; totalDuration: number } {
  return {
    totalPrice: recommended.reduce(
      (acc, s) => acc + s.price,
      includeBeard && hairType !== 'beard' ? 450 : 0
    ),
    totalDuration: recommended.reduce((acc, s) => acc + (s.duration || 45), 15),
  };
}
