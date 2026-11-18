// Варіанти тривалості послуги (T-4419): коротша/стандартна/довша тривалість з
// власною ціновою поправкою й описом. Слот будується від тривалості обраного
// варіанта; послуга без варіантів лишається «стандартом» (зворотна сумісність,
// T-041 не регресує).

export interface DurationVariant {
  label: string;
  duration: number; // хвилини, кратні 5
  parallelDuration: number | null;
  priceDelta: number; // поправка до ціни локації, UAH
  description: string | null;
}

export interface ServiceDurations {
  duration: number;
  parallelDuration: number | null;
  variants?: DurationVariant[] | undefined;
}

export class InvalidDurationVariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDurationVariantError';
  }
}

export const STANDARD_VARIANT_LABEL = 'standard';

function assertMinutes(value: number, what: string): void {
  if (!Number.isInteger(value) || value < 5 || value > 480) {
    throw new InvalidDurationVariantError(`${what} must be 5..480 minutes`);
  }
}

export function assertDurationVariant(variant: DurationVariant): DurationVariant {
  if (!variant.label.trim()) throw new InvalidDurationVariantError('A variant needs a label');
  assertMinutes(variant.duration, 'Duration');
  if (variant.parallelDuration != null)
    assertMinutes(variant.parallelDuration, 'Parallel duration');
  if (!Number.isInteger(variant.priceDelta)) {
    throw new InvalidDurationVariantError('Price delta must be a whole number of hryvnia');
  }
  return { ...variant };
}

/** Варіант за підписом; без підпису — стандартний (перший, якщо стандартного немає). */
export function selectDurationVariant(
  variants: DurationVariant[] | undefined,
  label?: string
): DurationVariant | null {
  const list = variants ?? [];
  if (list.length === 0) return null;
  if (label === undefined) {
    return list.find((variant) => variant.label === STANDARD_VARIANT_LABEL) ?? list[0] ?? null;
  }
  const found = list.find((variant) => variant.label === label);
  if (!found) throw new InvalidDurationVariantError(`Unknown duration variant: ${label}`);
  return found;
}

/** Тривалості слота для послуги з урахуванням обраного варіанта. */
export function resolveDurations(
  service: ServiceDurations,
  label?: string
): { duration: number; parallelDuration: number | null } {
  const variant = selectDurationVariant(service.variants, label);
  if (!variant) return { duration: service.duration, parallelDuration: service.parallelDuration };
  return { duration: variant.duration, parallelDuration: variant.parallelDuration };
}
