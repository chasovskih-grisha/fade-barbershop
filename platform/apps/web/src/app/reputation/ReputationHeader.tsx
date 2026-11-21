import Link from 'next/link';

const METRICS = [
  {
    label: 'Середній рейтинг мережі',
    value: '4.96',
    stars: '★★★★★',
    note: 'На основі 4,400+ верифікованих відгуків',
  },
  {
    label: 'Індекс лояльності NPS',
    value: '94%',
    note: 'Рекомендують FADE друзям та колегам',
  },
  {
    label: 'Повторні візити',
    value: '86.5%',
    note: 'Обирають свого майстра регулярно',
  },
];

export function ReputationHeader() {
  return (
    <header className="flex flex-col gap-6 border-b border-line pb-12 relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient p-8 md:p-14 shadow-xl border-line-strong/60">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />
      <Link
        href="/"
        className="text-body text-fg-secondary hover:text-fg w-fit transition-colors flex items-center gap-2 relative z-10"
      >
        &larr; На головну
      </Link>
      <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4.5 py-2 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm relative z-10">
        ✦ Бренд-репутація та ринковий лідерство у Києві
      </div>
      <h1 className="font-display text-[2.75rem] md:text-[3.5rem] font-bold text-fg leading-none relative z-10">
        Репутаційний індекс & Конкурентна розвідка
      </h1>
      <p className="max-w-3xl text-bodyLg text-fg-secondary relative z-10">
        Ми пишаємося кожним відгуком. Моніторинг ринкових показників, оцінок у Google Maps & Apple
        Maps та задоволеності гостей у режимі реального часу.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 relative z-10">
        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="p-6 rounded-card bg-surface-sunken/90 border border-line backdrop-blur-md flex flex-col gap-1.5 shadow-md"
          >
            <span className="text-caption font-bold text-accent-blue uppercase tracking-wider">
              {metric.label}
            </span>
            <span className="font-display text-[2.25rem] font-bold text-fg flex items-center gap-2">
              {metric.value}
              {metric.stars && (
                <span className="text-semantic-warning text-xl">{metric.stars}</span>
              )}
            </span>
            <span className="text-caption text-fg-secondary">{metric.note}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
