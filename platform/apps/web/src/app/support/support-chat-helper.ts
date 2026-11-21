const DEFAULT_BOT_RESPONSE =
  'Дякую за запитання! Наші спеціалісти також доступні через Telegram-консьєрж @fade_support_bot або за телефоном +380443334455.';

/** Deterministic keyword-based replies for the chat simulator. */
export function getBotResponse(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('скасув') || lower.includes('перенес')) {
    return 'Ви можете безкоштовно скасувати або перенести запис у «Особистий кабінет -> Мої візити» не пізніше ніж за 3 години до візиту.';
  }
  if (lower.includes('кешбек') || lower.includes('бонус') || lower.includes('знижк')) {
    return 'Ваш кешбек (5-10%) нараховується автоматично та доступний для оплати до 50% вартості наступних послуг.';
  }
  if (lower.includes('вартість') || lower.includes('цін') || lower.includes('прайс')) {
    return 'Ціни на послуги залежать від категорії майстера (Старший майстер, Топ-майстер, Експерт). Ви можете переглянути повний прайс у розділі «Послуги».';
  }
  return DEFAULT_BOT_RESPONSE;
}
