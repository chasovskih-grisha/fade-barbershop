// T-4609a: гейт «розходження checksum → ненульовий exit» для конвеєра бренд-асетів.
// Скрипт ганяється на тимчасових коренях (BRAND_ASSETS_PKG_ROOT/BRAND_SOURCE_DIR),
// щоб тест не торкався закомічених assets/ і checksums.json пакета.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), 'sync.mjs');
const FILES = [
  'mark-fa.svg',
  'mark-fa-on-dark.svg',
  'mark-fa-on-milk.svg',
  'lockup.svg',
  'lockup-on-dark.svg',
  'lockup-on-milk.svg',
  'favicon.svg',
  'favicon-16.png',
  'favicon-32.png',
  'app-icon-1024.svg',
  'app-icon-1024.png',
];

const run = (args, env) => {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { env, encoding: 'utf8' });
    return { status: 0, stdout };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: String(error.stdout ?? '') + String(error.stderr ?? ''),
    };
  }
};

function setup() {
  const root = mkdtempSync(join(tmpdir(), 'brand-assets-'));
  const pkg = join(root, 'pkg');
  const source = join(root, 'source');
  mkdirSync(source, { recursive: true });
  for (const name of FILES) writeFileSync(join(source, name), `fake ${name}`);
  const env = { ...process.env, BRAND_ASSETS_PKG_ROOT: pkg, BRAND_SOURCE_DIR: source };
  return { root, pkg, source, env };
}

test('sync копіює асети і пише маніфест; verify проходить', (t) => {
  const ctx = setup();
  t.after(() => rmSync(ctx.root, { recursive: true, force: true }));
  assert.equal(run([], ctx.env).status, 0);
  assert.equal(run(['--verify'], ctx.env).status, 0);
});

test('підміна асета ламає verify (ненульовий exit)', (t) => {
  const ctx = setup();
  t.after(() => rmSync(ctx.root, { recursive: true, force: true }));
  assert.equal(run([], ctx.env).status, 0);
  writeFileSync(join(ctx.pkg, 'assets', 'lockup.svg'), 'tampered');
  const result = run(['--verify'], ctx.env);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /lockup\.svg: checksum mismatch/);
});

test('assets без рядка в маніфесті — розходження', (t) => {
  const ctx = setup();
  t.after(() => rmSync(ctx.root, { recursive: true, force: true }));
  assert.equal(run([], ctx.env).status, 0);
  writeFileSync(join(ctx.pkg, 'assets', 'rogue.svg'), 'x');
  const result = run(['--verify'], ctx.env);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /untracked in manifest/);
});

test('verify без маніфесту падає з підказкою про sync', (t) => {
  const ctx = setup();
  t.after(() => rmSync(ctx.root, { recursive: true, force: true }));
  const result = run(['--verify'], ctx.env);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /run `pnpm --filter @fade\/brand-assets sync`/);
});

test('sync без source kit падає — джерело правди обовʼязкове', (t) => {
  const ctx = setup();
  t.after(() => rmSync(ctx.root, { recursive: true, force: true }));
  const result = run([], { ...ctx.env, BRAND_SOURCE_DIR: join(ctx.root, 'nope') });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /source kit not found/);
});
