/** Формат ціни: ₴, тисячі — нерозривний пробіл (design-system.md). */
const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, locale = 'uk'): string {
  const localeKey = locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'uk-UA';
  let formatter = formatters.get(localeKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(localeKey, {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    formatters.set(localeKey, formatter);
  }
  return formatter.format(amount);
}
