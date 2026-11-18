#!/usr/bin/env node
// T-4609a: конвеєр бренд-асетів у платформу. Джерело правди — brand/logo/system
// (лежить поза цим репозиторієм, AGENTS.md забороняє змішувати бізнес-документи
// з кодом), пакет — збутковий артефакт зі своїм checksum-маніфестом.
//   node scripts/sync.mjs           — копіює файли з джерела, пише checksums.json
//   node scripts/sync.mjs --verify  — sha256 assets/ проти маніфесту (і джерела,
//                                     якщо воно доступне) → exit 1 при розходженні
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT =
  process.env.BRAND_ASSETS_PKG_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR =
  process.env.BRAND_SOURCE_DIR ?? resolve(PKG_ROOT, '../../../company/brand/logo/system');
const ASSETS = join(PKG_ROOT, 'assets');
const MANIFEST = join(PKG_ROOT, 'checksums.json');

/** Ролі — за README з source kit (mark / lockup / favicon / app-icon). */
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

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const fail = (message) => {
  console.error(`brand-assets: ${message}`);
  process.exit(1);
};

function sync() {
  if (!existsSync(SOURCE_DIR)) fail(`source kit not found: ${SOURCE_DIR}`);
  mkdirSync(ASSETS, { recursive: true });
  const files = {};
  for (const name of FILES) {
    const source = join(SOURCE_DIR, name);
    if (!existsSync(source)) fail(`missing in source kit: ${name}`);
    copyFileSync(source, join(ASSETS, name));
    files[name] = sha256(source);
  }
  const manifest = { source: 'brand/logo/system', files };
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`brand-assets: synced ${FILES.length} files from ${SOURCE_DIR}`);
}

function verify() {
  if (!existsSync(MANIFEST))
    fail('checksums.json missing — run `pnpm --filter @fade/brand-assets sync`');
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const broken = [];
  for (const [name, expected] of Object.entries(manifest.files)) {
    const asset = join(ASSETS, name);
    if (!existsSync(asset)) broken.push(`${name}: asset missing`);
    else if (sha256(asset) !== expected) broken.push(`${name}: checksum mismatch`);
    // Джерело поза репо: у CI його немає — тоді чесним є лише маніфест.
    if (existsSync(SOURCE_DIR)) {
      const source = join(SOURCE_DIR, name);
      if (!existsSync(source)) broken.push(`${name}: gone from source kit`);
      else if (sha256(source) !== expected) broken.push(`${name}: drifted from brand/logo/system`);
    }
  }
  const untracked = existsSync(ASSETS) ? readdirSync(ASSETS).filter((n) => !manifest.files[n]) : [];
  if (untracked.length) broken.push(`untracked in manifest: ${untracked.join(', ')}`);
  if (broken.length) {
    for (const line of broken) console.error(`brand-assets: ${line}`);
    fail(`${broken.length} mismatch(es) — resync from brand/logo/system`);
  }
  console.log(`brand-assets: verified ${Object.keys(manifest.files).length} files`);
}

if (process.argv.includes('--verify')) verify();
else sync();
