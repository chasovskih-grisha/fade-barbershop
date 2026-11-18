// Monday-first індекс дня тижня (0=Пн … 6=Нд) — спільне правило моделі
// слотів scheduling. Живе тут одне, бо правило одне (DRY): вікна доступності,
// opening hours і слоти в Prisma зберігають саме цей індекс. Два входи —
// бо два джерела даних: миттєвий момент (Date, UTC-модель слотів) і дата
// рядком YYYY-MM-DD (DTO записів).

/** Індекс дня для миттєвого моменту (UTC). */
export function dayOfWeekIndex(day: Date): number {
  return (day.getUTCDay() + 6) % 7;
}

/** Індекс дня для дати YYYY-MM-DD з DTO (північ UTC). */
export function dayOfWeekFor(date: string): number {
  return dayOfWeekIndex(new Date(`${date}T00:00:00.000Z`));
}
