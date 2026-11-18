'use client';

interface Props {
  rateLimit: { max: number; windowMs: number };
  cacheTtlMs: number;
}

function formatTtl(ms: number): string {
  if (ms === 0) return 'вимкнено';
  const hours = ms / 3_600_000;
  if (hours >= 1) return `${hours} год`;
  return `${Math.round(ms / 60_000)} хв`;
}

export function LimitsDisplay({ rateLimit, cacheTtlMs }: Props) {
  return (
    <section
      className="flex flex-col gap-2 rounded-card border border-line bg-surface-raised p-4"
      aria-label="Поточні ліміти"
    >
      <h2 className="font-semibold text-h4">Діючі ліміти</h2>
      <p className="text-sm text-fg-secondary">
        {`Зовнішні запити: до ${rateLimit.max} за ${rateLimit.windowMs / 1000} с · кеш відповідей: ${formatTtl(cacheTtlMs)}.`}
        Ліміти читаються з налаштувань на кожен виклик — зміна набирає чинності без рестарту.
      </p>
    </section>
  );
}
