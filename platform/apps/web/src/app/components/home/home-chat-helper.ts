const DEFAULT_REPLY =
  'Дякуємо за запитання! Наш консьєрж опрацював запит. Для термінової допомоги ви також можете зателефонувати +38 (044) 334-33-33 або написати в Telegram @fade_support_bot.';

const REPLY_RULES: Array<{ patterns: string[]; reply: string }> = [
  {
    patterns: ['запис', 'час', 'записатися'],
    reply:
      'Записатися можна через кнопку «Записатися» у верхньому меню всього за 60 секунд. Потрібен лише ваш номер телефону!',
  },
  {
    patterns: ['знижк', 'акці', 'бонус'],
    reply:
      'Для нових гостей діє знижка -100 ₴ на перший візит, а також кешбек 5% на всі наступні відвідування.',
  },
  {
    patterns: ['адрес', 'де', 'карта'],
    reply:
      'Наші студії розташовані у зручних центральних локаціях Києва. Точну адресу можна обрати на етапі вибору локації під час запису.',
  },
];

/** Rule-based reply for the FAQ widget's local concierge demo. */
export function getBotReply(message: string): string {
  const lower = message.toLowerCase();
  const rule = REPLY_RULES.find((candidate) =>
    candidate.patterns.some((pattern) => lower.includes(pattern))
  );
  return rule?.reply ?? DEFAULT_REPLY;
}
