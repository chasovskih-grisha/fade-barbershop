// Слот-політика локації (T-4522): дефолти/діапазони дзеркалять API-валідацію
// (apps/api .../admin-barber-service.dto.ts, SLOT_POLICY_RANGES) — інакше форма
// пропустить те, що сервер відкине (400), і навпаки.

export type PolicyValues = {
  stepMinutes: number;
  bufferMinutes: number;
  horizonDays: number;
  lastMinuteMinutes: number;
};

export const POLICY_DEFAULTS: PolicyValues = {
  stepMinutes: 15,
  bufferMinutes: 0,
  horizonDays: 14,
  lastMinuteMinutes: 60,
};

export type PolicyFieldSpec = {
  field: keyof PolicyValues;
  label: string;
  help: string;
  min: number;
  max: number;
  /** Кратність (для кроку — 15, бо збереження бронювання вимагає 15-хв межі). */
  multipleOf?: number;
};

export const POLICY_FIELDS: PolicyFieldSpec[] = [
  {
    field: 'stepMinutes',
    label: 'Крок сітки, хв',
    help: 'Кратно 15: 15, 30, 45 або 60',
    min: 15,
    max: 60,
    multipleOf: 15,
  },
  {
    field: 'bufferMinutes',
    label: 'Буфер між записами, хв',
    help: 'Пауза після запису: прибирання, перерва барбера',
    min: 0,
    max: 120,
  },
  {
    field: 'horizonDays',
    label: 'Горизонт запису, днів',
    help: 'На скільки днів уперед відкритий запис',
    min: 1,
    max: 365,
  },
  {
    field: 'lastMinuteMinutes',
    label: 'Поріг «останньої хвилини», хв',
    help: 'Слот закривається для запису за цей час до початку',
    min: 0,
    max: 1440,
  },
];

/** Перший невалідний діапазон або null. Ідентічно серверній assertPolicyRange. */
export function validatePolicy(values: PolicyValues): string | null {
  for (const spec of POLICY_FIELDS) {
    const value = values[spec.field];
    const outOfRange = !Number.isInteger(value) || value < spec.min || value > spec.max;
    const offGrid = spec.multipleOf !== undefined && value % spec.multipleOf !== 0;
    if (outOfRange || offGrid) {
      const grid = spec.multipleOf ? `, кратно ${spec.multipleOf}` : '';
      return `${spec.label}: ціле число від ${spec.min} до ${spec.max}${grid}.`;
    }
  }
  return null;
}
