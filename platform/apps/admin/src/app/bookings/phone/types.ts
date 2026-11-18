// Типи відповіді слотів для телефонного запису (екран 3, адмін-стиль).
export interface AvailableSlotDto {
  start: string; // HH:mm
  end: string; // HH:mm
  barbers: string[];
}
