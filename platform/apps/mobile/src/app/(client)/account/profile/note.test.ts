import {
  EMPTY_SAVED_NOTE_MESSAGE,
  linesToNote,
  noteFitsLimit,
  noteToLines,
  savedNoteQuote,
} from './note';

describe('note rules (T-4721a)', () => {
  it('trims lines and drops blank ones', () => {
    expect(noteToLines('  коротше з боків  \n\n  без парфумів ')).toEqual([
      'коротше з боків',
      'без парфумів',
    ]);
  });

  it('accepts twenty lines of one hundred characters', () => {
    const note = Array.from({ length: 20 }, () => 'а'.repeat(100)).join('\n');
    expect(noteFitsLimit(note)).toBe(true);
  });

  it('refuses a twenty-first line', () => {
    const note = Array.from({ length: 21 }, () => 'рядок').join('\n');
    expect(noteFitsLimit(note)).toBe(false);
  });

  it('refuses a line longer than one hundred characters', () => {
    expect(noteFitsLimit('а'.repeat(101))).toBe(false);
  });

  it('treats an empty note as valid', () => {
    expect(noteFitsLimit('')).toBe(true);
    expect(noteToLines('')).toEqual([]);
  });

  it('restores stored lines as editable text', () => {
    expect(linesToNote(['перший', 'другий'])).toBe('перший\nдругий');
  });

  it('quotes the saved note', () => {
    expect(savedNoteQuote('коротше з боків')).toBe('коротше з боків');
  });

  it('says the master sees nothing when the note is empty', () => {
    expect(savedNoteQuote('')).toBe(EMPTY_SAVED_NOTE_MESSAGE);
  });
});
