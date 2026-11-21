// Ліміт нотатки «Вподобання» (T-4721b): ті самі правила, що застосовує
// `PATCH /api/account/preferences` і далі identity — трим рядків, порожні
// відкидаються, до 20 рядків, до 100 символів у рядку. Екран відмовляє
// українською до запиту, а не показує англійський 400 з роута.

export const MAX_PREFERENCE_LINES = 20;
export const MAX_PREFERENCE_LINE_LENGTH = 100;

export const PREFERENCE_LIMIT_MESSAGE = 'Не більше 20 рядків, до 100 символів у рядку';

/** Рядки нотатки так, як їх збереже роут: трим, порожні відкинуто. */
export function splitPreferenceLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Чи нотатка в межах ліміту (порожня — теж валідна). */
export function isWithinPreferenceLimit(lines: string[]): boolean {
  return (
    lines.length <= MAX_PREFERENCE_LINES &&
    lines.every((line) => line.length <= MAX_PREFERENCE_LINE_LENGTH)
  );
}

export const EMPTY_SAVED_NOTE_MESSAGE = 'Майстер ще нічого не побачить';

/** Цитата останньої збереженої нотатки — рядки так, як їх написав клієнт. */
export function savedNoteQuote(savedLines: string[]): string {
  return savedLines.length ? savedLines.join('\n') : EMPTY_SAVED_NOTE_MESSAGE;
}
