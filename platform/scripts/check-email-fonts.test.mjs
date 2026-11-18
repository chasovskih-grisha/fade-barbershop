// Тести гейта «email = системний стек» (T-4611a).
//
// Гейт мусить червоніти на Fixel у font-family листа й зеленіти на
// системному стеку з токена. Фікстури будуються в пам'яті — без реального коду.
// Запуск: `pnpm email:test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEmailFontsSource } from './check-email-fonts.mjs';

test('Fixel Display у font-family — порушення', () => {
  const src = 'const s = `font-family:Fixel Display, sans-serif;`;';
  const v = checkEmailFontsSource(src);
  assert.equal(v.length, 1);
  assert.equal(v[0].line, 1);
});

test('Fixel Text у font-family — порушення', () => {
  assert.equal(checkEmailFontsSource('font-family: "Fixel Text";').length, 1);
});

test('системний стек — чисто', () => {
  const src = 'font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;';
  assert.deepEqual(checkEmailFontsSource(src), []);
});

test('Fixel поза font-family (коментар) не рахується', () => {
  const src = '// Fixel у листах не використовується\nconst x = 1;';
  assert.deepEqual(checkEmailFontsSource(src), []);
});

test('номер рядка вказує на порушення', () => {
  const src = ['const a = 1;', 'font-family:Fixel Display;'].join('\n');
  assert.equal(checkEmailFontsSource(src)[0].line, 2);
});
