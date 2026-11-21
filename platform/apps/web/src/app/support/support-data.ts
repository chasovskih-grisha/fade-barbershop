export interface FaqItem {
  id: string;
  category: 'booking' | 'service' | 'loyalty' | 'payment';
  question: string;
  answer: string;
}

export interface DiagnosticScenario {
  id: string;
  title: string;
  advice: string;
  actionLabel: string;
  actionUrl: string;
}

export const FAQ_DATA: FaqItem[] = [
  {
    id: '1',
    category: 'booking',
    question: 'Як скасувати або перенести запис?',
    answer:
      'Ви можете самостійно керувати своїми записами в розділі «Особистий кабінет -> Мої візити» не пізніше ніж за 3 години до початку візиту. Також доступна швидка допомога через Telegram-консьєрж.',
  },
  {
    id: '2',
    category: 'booking',
    question: 'Що робити, якщо я запізнююся на стрижку?',
    answer:
      'Будь ласка, повідомте адміністратора за телефоном обраного барбершопу або через Telegram. Якщо запізнення перевищує 15 хвилин, майстер може бути змушений скоротити перелік послуг або перенести візит.',
  },
  {
    id: '3',
    category: 'service',
    question: 'Які послуги входять до комплексу «Стрижка + Борода»?',
    answer:
      'Комплекс включає консультацію стиліста, моделювання зачіски, миття голови професійною косметикою, стрижку бороди тримером та бритвами з гарячим рушником і стайлінг.',
  },
  {
    id: '4',
    category: 'loyalty',
    question: 'Як працює кешбек та програма лояльності FADE CLUB?',
    answer:
      'Кожен гість автоматично отримує кешбек від 5% до 10% у вигляді бонусів на рахунок із кожної оплаченої послуги чи покупки косметики. Бонусами можна сплатити до 50% наступного візиту.',
  },
  {
    id: '5',
    category: 'payment',
    question: 'Чи можна розрахуватися карткою або криптовалютою?',
    answer:
      'Ми приймаємо всі основні платіжні картки (Visa, Mastercard, Apple Pay, Google Pay), а також безготівковий розрахунок для корпоративних клієнтів і криптовалютні платежі.',
  },
];

export const DIAGNOSTIC_SCENARIOS: DiagnosticScenario[] = [
  {
    id: 'late',
    title: '⏳ Я запізнююся на візит',
    advice:
      'Якщо запізнення становить менше 15 хвилин, майстер чекає на вас. При запізненні понад 15 хвилин зв’яжіться з адміністратором для коригування послуг.',
    actionLabel: 'Зателефонувати адміністратору',
    actionUrl: 'tel:+380443334455',
  },
  {
    id: 'reschedule',
    title: '🔄 Хочу перенести або скасувати запис',
    advice:
      'Ви можете безкоштовно змінити час або скасувати запис у Кабінеті клієнта не пізніше ніж за 3 години до початку візиту.',
    actionLabel: 'Відкрити Мої візити',
    actionUrl: '/account/appointments',
  },
  {
    id: 'loyalty',
    title: '💎 Перевірка кешбеку та бонусів',
    advice:
      'Ваш баланс бонусів автоматично накопичується з кожної послуги (від 5% до 10%). Бонусами можна сплатити до 50% вартості.',
    actionLabel: 'Перейти в кабінет',
    actionUrl: '/account',
  },
  {
    id: 'payment',
    title: '💳 Питання щодо оплати та чеків',
    advice:
      'Ми приймаємо картки Visa/Mastercard, Apple Pay, Google Pay, а також криптовалюту та корпоративні безготівкові платежі.',
    actionLabel: 'Написати консьєржу',
    actionUrl: 'https://t.me/fade_support_bot',
  },
];

export const FAQ_CATEGORIES = [
  { id: 'all', label: 'Усі' },
  { id: 'booking', label: 'Записи та візити' },
  { id: 'service', label: 'Послуги' },
  { id: 'loyalty', label: 'Лояльність' },
  { id: 'payment', label: 'Оплата' },
];

export function filterFaqs(searchQuery: string, selectedCategory: string): FaqItem[] {
  return FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });
}
