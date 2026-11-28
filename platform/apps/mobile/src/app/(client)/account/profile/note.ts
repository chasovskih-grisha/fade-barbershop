export const NOTE_MAX_LINES = 20;
export const NOTE_MAX_LINE_LENGTH = 100;
export const NOTE_LIMIT_MESSAGE = 'Не більше 20 рядків, до 100 символів у рядку';

/** Рядки нотатки для PATCH: обрізані, без порожніх. */
export function noteToLines(note: string): string[] {
  return note
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Нотатка в межах ліміту (T-4721a §2): 20 рядків, по 100 символів. */
export function noteFitsLimit(note: string): boolean {
  const lines = noteToLines(note);
  return (
    lines.length <= NOTE_MAX_LINES && lines.every((line) => line.length <= NOTE_MAX_LINE_LENGTH)
  );
}

/** Збережена нотатка як текст поля. */
export function linesToNote(lines: readonly string[]): string {
  return lines.join('\n');
}

export const EMPTY_SAVED_NOTE_MESSAGE = 'Майстер ще нічого не побачить';

/** Цитата останньої збереженої нотатки (T-4731a §2). */
export function savedNoteQuote(savedNote: string): string {
  return savedNote.length ? savedNote : EMPTY_SAVED_NOTE_MESSAGE;
}
