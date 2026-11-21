import type { ConversionIntelligenceReport } from './ConversionIntelligenceManager';

type ReportKey = keyof ConversionIntelligenceReport;

const CARDS: Array<{
  label: string;
  value: ReportKey;
  note: string;
  tone: string;
  suffix?: string;
}> = [
  {
    label: 'Загальна конверсія',
    value: 'overallConversionRate',
    note: '↑ +3.4% порівняно з минулим місяцем',
    tone: 'text-semantic-success',
    suffix: '%',
  },
  {
    label: 'Відтік на чекауті',
    value: 'abandonedCheckoutRate',
    note: '↓ -2.1% оптимізація кроків',
    tone: 'text-semantic-danger',
    suffix: '%',
  },
  {
    label: 'Повторні клієнти (Retention)',
    value: 'repeatCustomerRate',
    note: 'Висока лояльність бази',
    tone: 'text-semantic-success',
    suffix: '%',
  },
  {
    label: 'Середній час до бронювання',
    value: 'avgTimeToConversionMinutes',
    note: 'Швидкий мобільний потік',
    tone: 'text-fg-muted',
    suffix: ' хв',
  },
];

export default function ConversionReportCards({
  report,
}: {
  report: ConversionIntelligenceReport;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {CARDS.map((card) => (
        <div
          key={card.value}
          className="p-4 rounded-card border border-line bg-surface flex flex-col gap-1"
        >
          <span className="text-body-sm text-fg-secondary">{card.label}</span>
          <span className="text-h2 font-display font-bold text-fg">
            {report[card.value]}
            {card.suffix ?? ''}
          </span>
          <span className={`text-caption font-medium ${card.tone}`}>{card.note}</span>
        </div>
      ))}
    </div>
  );
}
