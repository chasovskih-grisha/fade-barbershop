import { KPI_CARDS } from './retention-data';

export default function RetentionKpis() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {KPI_CARDS.map((card) => (
        <div key={card.label} className="bg-white p-4 rounded-card border border-line shadow-sm">
          <p className="text-sm text-fg-muted font-medium">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${card.tone}`}>{card.value}</p>
          <span className={`text-xs font-semibold mt-1 inline-block ${card.noteTone}`}>
            {card.note}
          </span>
        </div>
      ))}
    </div>
  );
}
