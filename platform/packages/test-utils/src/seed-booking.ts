// Сід барбер-фікстур: user, прив'язка до локації (віконце + призначення) і
// сирих Booking-рядків (walk-in перешкоди). Повторюване дублювання чотирьох
// сюїт зібрано в спільні примітиви. prettier-ignore біля даних (ADR 0019).
import { uuidv7 } from '@fade/domain-shared';
import type { TestDb } from './db-port';
import { testPhone } from './seed-phone';

/** User(role: barber) з валідним тестовим телефоном. Повертає id —
 * сюїти передають його далі в assignBarber і в payload запитів. */
export async function seedBarberUser(
  prisma: TestDb,
  input: { id?: string; name?: string } = {}
): Promise<string> {
  const userId = input.id ?? uuidv7();
  // prettier-ignore
  await prisma.user.create({ data: { id: userId, phone: testPhone(), role: 'barber', name: input.name ?? 'E2E barber', active: true } });
  return userId;
}

/** Прив'язка барбера до локації: staffAssignment завжди, availabilityWindow
 * опційно (чужолокаційному барберу віконце не потрібне). */
export async function assignBarber(
  prisma: TestDb,
  input: {
    locationId: string;
    barberId: string;
    dayOfWeek?: number;
    window?: { start: string; end: string };
  }
): Promise<void> {
  await prisma.staffAssignment.create({
    data: { id: uuidv7(), locationId: input.locationId, barberId: input.barberId },
  });
  if (input.window) {
    await prisma.availabilityWindow.create({
      data: {
        // prettier-ignore
        id: uuidv7(),
        locationId: input.locationId,
        barberId: input.barberId,
        dayOfWeek: input.dayOfWeek ?? 0,
        start: input.window.start,
        end: input.window.end,
      },
    });
  }
}

/** Сирий Booking-рядок (walk-in перешкода або протилежна нога race-тесту):
 * status='booked', version=0, barberId довільний — агрегат Appointment
 * не створюється, це саме перешкода в розкладі. */
export async function seedRawBooking(
  prisma: TestDb,
  input: { locationId: string; barberId: string; start: Date; end: Date; id?: string }
): Promise<string> {
  const id = input.id ?? uuidv7();
  // prettier-ignore
  await prisma.booking.create({ data: { id, barberId: input.barberId, locationId: input.locationId, start: input.start, end: input.end, version: 0 } });
  return id;
}

/** Сирий walk-in: повний день 00:00–23:59 на DATE (перекриває будь-який слот). */
export function walkInWindow(dateIso: string): { start: Date; end: Date } {
  return { start: new Date(`${dateIso}T00:00:00.000Z`), end: new Date(`${dateIso}T23:59:59.000Z`) };
}
