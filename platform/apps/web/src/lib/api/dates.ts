/** Сьогодні в UTC як YYYY-MM-DD (слоти API живуть у датній сітці UTC). */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0] as string;
}
