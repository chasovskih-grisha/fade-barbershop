import type { ServiceDto } from '../../../lib/api/catalog';

export interface SlotOption {
  start: Date;
  end: Date;
}

export function walkInSlots(durationMinutes: number): SlotOption[] {
  const first = new Date(Date.now() + 15 * 60_000);
  return Array.from({ length: 3 }, (_, index) => {
    const start = new Date(first.getTime() + index * 30 * 60_000);
    return {
      start,
      end: new Date(start.getTime() + Math.max(durationMinutes, 30) * 60_000),
    };
  });
}

export function slotLabel(slot: SlotOption): string {
  const time = (value: Date) =>
    value.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  return `${time(slot.start)} — ${time(slot.end)}`;
}

export function priceLabel(service: ServiceDto | null): string {
  return service ? `${service.price} ₴` : '—';
}

export function phoneValid(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 9;
}
