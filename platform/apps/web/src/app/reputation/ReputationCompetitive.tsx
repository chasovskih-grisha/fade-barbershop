const ADVANTAGES = [
  {
    title: '0% Очікування',
    text: 'Точний таймінг запису та автоматичне сповіщення у Telegram.',
  },
  {
    title: 'Преміум-косметика',
    text: 'Ексклюзивні британські та американські бренди у кожній процедурі.',
  },
  {
    title: 'Кешбек до 10%',
    text: 'Накопичувальна бонусна програма FADE CLUB з першого візиту.',
  },
  {
    title: 'Геометрія та гарантія',
    text: 'Індивідуальний підбір форми черепа з цифровим архівом образів.',
  },
];

export function ReputationCompetitive() {
  return (
    <div className="p-8 rounded-card border border-line bg-surface shadow-xl flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">
          Аудит ринкового середовища Києва
        </span>
        <h3 className="font-display text-h3 font-bold text-fg">
          Чому гості обирають FADE замість класичних барбершопів
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {ADVANTAGES.map((item) => (
          <div
            key={item.title}
            className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-2"
          >
            <span className="text-h4 font-display font-bold text-fg">{item.title}</span>
            <p className="text-caption text-fg-secondary">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
