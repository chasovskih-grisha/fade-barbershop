const HIGHLIGHTS = [
  {
    value: '5+ років',
    label: 'Середній досвід роботи у преміум-сегменті',
  },
  {
    value: '100%',
    label: 'Індивідуальний підхід до форми черепа та стилю',
  },
  {
    value: 'Прямий запис',
    label: 'Обирайте свого улюбленого майстра в один клік',
  },
];

export function BarbersHighlights() {
  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-line">
      {HIGHLIGHTS.map(({ value, label }) => (
        <div
          key={value}
          className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-1.5"
        >
          <span className="text-h4 font-display font-bold text-fg">{value}</span>
          <span className="text-caption text-fg-secondary font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
