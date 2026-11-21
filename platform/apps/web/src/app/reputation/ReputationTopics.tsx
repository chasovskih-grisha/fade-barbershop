interface Topic {
  icon: string;
  name: string;
  score: string;
  widthClass: string;
  mentions: string;
}

const TOPICS: Topic[] = [
  {
    icon: '✂️',
    name: 'Якість стрижки та геометрія',
    score: '99.4%',
    widthClass: 'w-[99.4%]',
    mentions: '1,840 згадок • Висока точність роботи майстрів згідно з протоколами FADE.',
  },
  {
    icon: '☕',
    name: 'Атмосфера та напої',
    score: '98.8%',
    widthClass: 'w-[98.8%]',
    mentions: '1,210 згадок • Фірмова кава, музичний супровід та лаунж-зона.',
  },
  {
    icon: '⏱️',
    name: 'Пунктуальність і таймінг',
    score: '99.1%',
    widthClass: 'w-[99.1%]',
    mentions: '950 згадок • Початок процедури чітко у заброньований час.',
  },
  {
    icon: '💰',
    name: 'Ціноутворення та кешбек',
    score: '97.9%',
    widthClass: 'w-[97.9%]',
    mentions: '680 згадок • Прозора вартість і приємні бонуси FADE CLUB.',
  },
  {
    icon: '🧴',
    name: 'Косметика та догляд',
    score: '98.5%',
    widthClass: 'w-[98.5%]',
    mentions: '520 згадок • Преміальні засоби для бороди та стайлінгу.',
  },
];

function TopicCard({ topic }: { topic: Topic }) {
  return (
    <div className="p-6 rounded-card bg-surface-sunken border border-line flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-body font-bold text-fg">
          {topic.icon} {topic.name}
        </span>
        <span className="text-caption font-bold text-accent-blue">{topic.score} POS</span>
      </div>
      <div className="w-full bg-line h-2 rounded-full overflow-hidden">
        <div className={`bg-accent-blue h-full ${topic.widthClass}`} />
      </div>
      <span className="text-caption text-fg-secondary">{topic.mentions}</span>
    </div>
  );
}

export function ReputationTopics() {
  return (
    <div className="p-8 rounded-card border border-line bg-surface shadow-xl flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">
          Аналіз ключових тем & Розподіл тональності
        </span>
        <h3 className="font-display text-h3 font-bold text-fg">Тематичний зріз відгуків гостей</h3>
        <p className="text-body text-fg-secondary">
          Автоматична NLP-класифікація відгуків у реальному часі за ключовими аспектами сервісу.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOPICS.map((topic) => (
          <TopicCard key={topic.name} topic={topic} />
        ))}
      </div>
    </div>
  );
}
