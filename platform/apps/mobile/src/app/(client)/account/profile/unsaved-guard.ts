/** Питання сайту (T-4733a, `web-cabinet-screens.md` §2) у застосунку (T-4733c). */
export const UNSAVED_TITLE = 'Зберегти зміни?';
export const UNSAVED_DESCRIPTION = 'Ви змінили профіль. Зберегти перед переходом?';
export const UNSAVED_SAVE = 'Зберегти';
export const UNSAVED_DISCARD = 'Не зберігати';
export const UNSAVED_STAY = 'Залишитись';

export function isProfileDirty(name: string, storedName: string, noteChanged: boolean): boolean {
  return name !== storedName || noteChanged;
}
