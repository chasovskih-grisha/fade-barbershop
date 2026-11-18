// Часовий діапазон візиту: якщо початок і кінець в один день — дата один раз
// («01.10.2026, 13:15–14:45»), інакше дата двічі. Час без дати — для журналу.
const DAY = 24 * 60 * 60 * 1000;

const day = (value: Date) => value.toLocaleDateString('uk-UA');
const hhmm = (value: Date) =>
  value.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

/** Дата + час одним рядком («01.10.2026, 13:15»). */
export const fullDateTime = (iso: string) => {
  const value = new Date(iso);
  return `${day(value)}, ${hhmm(value)}`;
};

/** Діапазон start–end; різні дні → дата двічі, як у календарі. */
export const timeRange = (startIso: string, endIso: string): string => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (end.getTime() - start.getTime() < DAY) return `${day(start)}, ${hhmm(start)}–${hhmm(end)}`;
  return `${fullDateTime(startIso)}–${fullDateTime(endIso)}`;
};

/** Лише час — для журналу подій (дата вже є в контексті списку). */
export const time = (iso: string) => hhmm(new Date(iso));

export const money = (value: number) =>
  `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value)} ₴`;

/** Короткий id для щільних рядків (ноги партії, список барберів). */
export const shortId = (value: string) => value.slice(0, 8);
