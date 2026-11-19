// Класифікація даних і політика утримання (T-4490). Політика — це таблиця:
// новий набір даних додається одним рядком, а purge-воркер читає її, а не
// власні if-и. «Назавжди» дозволено лише фінансовим регістрам (legal hold),
// і то явним списком, а не замовчуванням.

export type Classification = 'public' | 'internal' | 'confidential' | 'personal';

export type RetentionDataset = 'otp_challenges' | 'sessions' | 'notification_records' | 'waitlist_entries';

export interface RetentionRule {
  dataset: RetentionDataset;
  classification: Classification;
  /** Скільки днів тримаємо після «початку відліку» набору (див. table). */  ttlDays: number;
  /** Що саме видаляється — для аудиту й ревʼю. */  note: string;
}

export const RETENTION_RULES: readonly RetentionRule[] = [
  {
    dataset: 'otp_challenges',
    classification: 'personal',
    ttlDays: 7,
    note: 'OTP-коди (хеші) після використання/прострочення — 7 днів',
  },
  {
    dataset: 'sessions',
    classification: 'personal',
    ttlDays: 30,
    note: 'Відкликані/прострочені сесії — 30 днів після завершення',
  },
  {
    dataset: 'notification_records',
    classification: 'personal',
    ttlDays: 90,
    note: 'Журнал доставки (одержувач = PII) — 90 днів',
  },
  {
    dataset: 'waitlist_entries',
    classification: 'personal',
    ttlDays: 180,
    note: 'Записи у чергу — 180 днів після скасування/завершення',  }
];

export function ruleFor(dataset: RetentionDataset): RetentionRule | undefined {
  return RETENTION_RULES.find((rule) => rule.dataset === dataset);
}

/** Cutoff = «усе, що старше за цю межу, видаляємо». */  export function cutoffFor(rule: RetentionRule, now: Date): Date {
  return new Date(now.getTime() - rule.ttlDays * 24 * 60 * 60 * 1000);
}

/**\n * Legal hold: явний список наборів, які не можна чіпати (судова справа,\n * розслідування). Конфіг: `RETENTION_LEGAL_HOLD=sessions,notification_records`.\n */  export function legalHolds(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const raw = env.RETENTION_LEGAL_HOLD ?? '';\n  return new Set(\n    raw\n      .split(',')\n      .map((item) => item.trim())\n      .filter(Boolean)\n  );
}

/**\n * Audit entry for purge operation. */  export interface RetentionAuditEntry {\n  dataset: string;\n  cutoff: string;\n  purged: number;\n  remainingExpired: number;\n  held: boolean;\n}\n"}