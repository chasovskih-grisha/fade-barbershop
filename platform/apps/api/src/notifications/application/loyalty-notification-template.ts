export function renderCounterIncrementedSms(newCount: number): string {
  return `FADE: Вітаємо з візитом! Ваш прогрес лояльності: ${newCount}/6 (кожен 7-й візит — безкоштовний).`;
}

export function renderFreeVisitGrantedSms(): string {
  return `FADE: Вітаємо! Ви накопичили 6 візитів та отримали безкоштовний 7-й візит! Покажіть це повідомлення адміністратору.`;
}
