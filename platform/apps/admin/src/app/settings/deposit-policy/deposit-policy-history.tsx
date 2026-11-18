'use client';

// Історія версій політики депозиту (T-4444): з якими правилами погоджувалися
// клієнти. Порожня історія (жодної зміни) не малює порожнього блоку.
import type { PolicyVersionRow } from './use-deposit-policy';

const KYIV = 'Europe/Kyiv';

const stamp = (iso: string): string =>
  new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: KYIV,
  }).format(new Date(iso));

export default function DepositPolicyHistory({ rows }: { rows: PolicyVersionRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-label="Історія версій">
      <h2 className="text-body font-medium text-fg">Історія версій</h2>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.version}
            className="rounded-input border border-line bg-surface-base px-4 py-3"
          >
            <span className="font-medium text-fg">Версія {row.version}</span>
            <span className="text-body text-fg-secondary">
              {' · '}
              {row.percent}% · округлення {row.rounding} грн · вікно {row.cancellationWindowHours}{' '}
              год
            </span>
            <span className="block text-caption text-fg-muted">{stamp(row.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
