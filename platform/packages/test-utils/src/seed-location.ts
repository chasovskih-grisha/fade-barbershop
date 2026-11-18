// Спільний e2e-сід локації: агрегат цілком одним nested-create — крісла +
// години. prettier-ignore біля даних: розгортання prettier ламає LOC-гейт
// (ADR 0019 — виняток іменований тут, біля даних).
import { uuidv7 } from '@fade/domain-shared';
import type { TestDb } from './db-port';

export interface SeedLocationInput {
  /** Явний id (коли сюїта посилається на локацію поза seed). */
  id?: string;
  codePrefix?: string; // дефолт 'E2E'; код = `${prefix}-${UUID8}` — унікальний між прогонами.
  name?: string;
  active?: boolean;
  chairs?: number; // дефолт 1.
  /** Дефолт — усі дні 08:00–18:00 відкрито; override для вихідних/інших годин. */
  hours?: { dayOfWeek: number; open: string | null; close: string | null; closed: boolean }[];
}

export interface SeededLocation {
  id: string;
  code: string;
  chairIds: string[];
}

/** Створює локацію з кріслами й годинами одним nested-create (агрегат цілком). */
export async function seedTestLocation(
  prisma: TestDb,
  input: SeedLocationInput = {}
): Promise<SeededLocation> {
  const id = input.id ?? uuidv7();
  const code = `${input.codePrefix ?? 'E2E'}-${uuidv7().slice(-8).toUpperCase()}`;
  const count = input.chairs ?? 1;
  const chairIds = Array.from({ length: count }, () => uuidv7());
  const hours =
    input.hours ??
    Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      open: '08:00',
      close: '18:00',
      closed: false,
    }));
  // prettier-ignore — пласкі фіктурні дані (ADR 0019).
  await prisma.location.create({
    data: {
      id,
      code,
      name: input.name ?? 'E2E location',
      address: 'Temporary',
      lat: 50.45,
      lng: 30.52,
      active: input.active ?? true,
      chairs: { create: chairIds.map((cid, i) => ({ id: cid, number: i + 1, active: true })) },
      // T-4300b: PK — uuid без DB-дефолту, тож nested-рядки теж отримують id.
      hours: { create: hours.map((hour) => ({ id: uuidv7(), ...hour })) },
    },
  });
  return { id, code, chairIds };
}
