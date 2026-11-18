import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SEATS = [
  'product-owner',
  'content-editor',
  'project-manager',
  'conductor',
  'qa',
  'backend-developer',
  'frontend-developer',
  'mobile-developer',
  'designer',
  'seo',
  'devops',
];

const KINDS = new Set(['discover', 'implement', 'accept']);
const QA_OWNS = new Set(['packages/test-utils', 'apps/api/src/e2e']);

export function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return {};
  const end = text.indexOf('\n---', 4);
  if (end === -1) return {};
  const data = {};
  const lines = text.slice(4, end).split('\n');
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) {
      index += 1;
      continue;
    }
    const key = match[1];
    const rest = match[2].trim();
    if (rest === '') {
      const items = [];
      index += 1;
      while (index < lines.length && /^ {2}- /.test(lines[index])) {
        items.push(lines[index].replace(/^ {2}- /, '').trim());
        index += 1;
      }
      data[key] = items;
      continue;
    }
    if (rest.startsWith('[')) {
      const inner = rest.endsWith(']') ? rest.slice(1, -1) : rest.slice(1);
      data[key] = inner
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }
    if (rest === 'true' || rest === 'false') data[key] = rest === 'true';
    else data[key] = rest.replace(/^"|"$/g, '');
    index += 1;
  }
  return data;
}

const read = (path) => readFileSync(path, 'utf8');

const listDirs = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory()) : [];

const listMd = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.md')) : [];

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const prefixes = (shorter, longer) => {
  if (shorter === longer) return true;
  const base = shorter.endsWith('/') ? shorter : `${shorter}/`;
  return longer.startsWith(base);
};

const exceptCovers = (except, longer) =>
  except.some((entry) => entry === longer || prefixes(entry, longer));

const productPath = (path) => path.startsWith('apps/') || path.startsWith('packages/');

export function validateAgents(root) {
  const errors = [];
  if (!existsSync(join(root, 'agents'))) return { ok: false, errors: ['agents/ is missing'] };

  const rolesDir = join(root, 'agents', 'roles');
  const seats = [];

  for (const seat of listDirs(rolesDir)) {
    if (!SEATS.includes(seat)) errors.push(`unknown seat ${seat}`);
    const rolePath = join(rolesDir, seat, 'ROLE.md');
    let writesProduct;
    if (!existsSync(rolePath)) errors.push(`ROLE.md missing for ${seat}`);
    else {
      const role = parseFrontmatter(read(rolePath));
      if (role.name !== seat) errors.push(`ROLE.md name ${role.name} does not match ${seat}`);
      if (typeof role.writes_product !== 'boolean')
        errors.push(`writes_product is missing for ${seat}`);
      writesProduct = role.writes_product;
    }

    const domains = [];
    for (const file of listMd(join(rolesDir, seat, 'domains'))) {
      const domain = parseFrontmatter(read(join(rolesDir, seat, 'domains', file)));
      const owns = asList(domain.owns);
      const except = asList(domain.except);
      if (domain.seat && domain.seat !== seat)
        errors.push(`domain ${file} seat ${domain.seat} is not ${seat}`);
      domains.push({ file, owns, except, seat });
      if (writesProduct === false) {
        for (const path of owns) {
          if (seat === 'qa' && QA_OWNS.has(path)) continue;
          if (productPath(path))
            errors.push(`${seat} writes_product false owns product path ${path}`);
        }
      }
    }

    const automations = [];
    for (const file of listMd(join(rolesDir, seat, 'automations'))) {
      const automation = parseFrontmatter(read(join(rolesDir, seat, 'automations', file)));
      automations.push(automation);
      if (!KINDS.has(automation.kind)) {
        errors.push(
          `automation ${automation.name ?? file} kind "${automation.kind}" is not discover, implement, or accept`
        );
      }
      if (automation.seat && automation.seat !== seat) {
        errors.push(`automation ${automation.name} seat ${automation.seat} is not ${seat}`);
      }
      if (automation.model && automation.model !== 'flash_lite') {
        errors.push(`automation ${automation.name} model ${automation.model} is not flash_lite`);
      }
      if (automation.kind === 'implement' && writesProduct === false) {
        errors.push(
          `implement automation ${automation.name} is on ${seat} which does not write product code`
        );
      }
      if (automation.kind === 'accept' && seat !== 'qa') {
        errors.push(`accept automation ${automation.name} seat is ${seat}`);
      }
      if (automation.kind === 'discover') {
        for (const domain of domains) {
          for (const path of domain.owns) {
            if (productPath(path))
              errors.push(`discover automation ${automation.name} owns product path ${path}`);
          }
        }
      }
    }

    seats.push({ seat, domains, automations });
  }

  const owned = [];
  for (const { seat, domains } of seats) {
    for (const domain of domains) {
      for (const path of domain.owns) owned.push({ seat, path, except: domain.except });
    }
  }

  for (let left = 0; left < owned.length; left += 1) {
    for (let right = left + 1; right < owned.length; right += 1) {
      const a = owned[left];
      const b = owned[right];
      const aCoversB = prefixes(a.path, b.path);
      const bCoversA = prefixes(b.path, a.path);
      if (!aCoversB && !bCoversA) continue;
      if (aCoversB && exceptCovers(a.except, b.path)) continue;
      if (bCoversA && exceptCovers(b.except, a.path)) continue;
      errors.push(`${a.seat} owns ${a.path} overlaps ${b.seat} owns ${b.path}`);
    }
  }

  for (const { seat, domains } of seats) {
    for (const domain of domains) {
      for (const entry of domain.except) {
        const held = owned.some(
          (item) => item.seat !== seat && (item.path === entry || prefixes(item.path, entry))
        );
        if (!held) errors.push(`except ${entry} on ${seat} is not owned by another seat`);
      }
    }
  }

  const skillsDir = join(root, 'agents', 'skills');
  for (const name of listDirs(skillsDir)) {
    const skillPath = join(skillsDir, name, 'SKILL.md');
    if (!existsSync(skillPath)) {
      errors.push(`SKILL.md missing for ${name}`);
      continue;
    }
    const skill = parseFrontmatter(read(skillPath));
    if (skill.name !== name) errors.push(`SKILL.md name ${skill.name} does not match ${name}`);
  }

  return { ok: errors.length === 0, errors };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const result = validateAgents(process.cwd());
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  console.log('agents ok');
}
