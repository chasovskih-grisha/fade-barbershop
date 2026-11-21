#!/usr/bin/env node
// T-4801 · Гейт звʼязки трейсингу: api → OTLP-колектор → Tempo → Grafana.
//
// SDK (apps/api/src/otel.ts) вмикається лише тоді, коли виконуються три умови:
// імпорт стоїть першим у main.ts, compose дає ендпоінт на порт, який колектор
// справді слухає, і колектор має експортер у Tempo, чий порт збігається з
// datasource Grafana. Кожна з них ламається тихо: трейс просто не зʼявляється,
// і побачити це можна лише в Grafana через тиждень. Тому — статичний гейт.
//
// Запуск: `pnpm otel:check` (з platform/). Тести: `pnpm otel:test`.
// Вивід: `file: message`, exit 1 на будь-яке порушення.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FILES = {
  main: 'apps/api/src/main.ts',
  otel: 'apps/api/src/otel.ts',
  compose: 'infra/docker-compose.yml',
  collector: 'infra/otel-collector/otel.yml',
  datasource: 'infra/grafana/provisioning/datasources/tempo.yml',
};

/** Перший `import` у файлі мусить бути саме `./otel`: SDK реєструється до http. */
export function checkOtelImportFirst(mainSrc) {
  const first = mainSrc.split('\n').find((line) => /^\s*import\s/.test(line));
  if (!first) return ['main.ts без жодного import — otel не підключено'];
  if (!/^import\s+['"]\.\/otel['"];/.test(first.trim())) {
    return [`перший import мусить бути './otel', а не «${first.trim()}»`];
  }
  return [];
}

/** Порт OTLP/HTTP-приймача колектора з `endpoint: 0.0.0.0:4318`. */
export function collectorHttpPort(collectorYaml) {
  const m = /http:\s*\n\s*endpoint:\s*[\d.]+:(\d+)/.exec(collectorYaml);
  return m ? Number(m[1]) : undefined;
}

/** Порт з `OTEL_EXPORTER_OTLP_ENDPOINT` сервісу api у compose. */
export function apiOtlpPort(composeSrc) {
  const m = /OTEL_EXPORTER_OTLP_ENDPOINT:\s*\S+:(\d+)/.exec(composeSrc);
  return m ? Number(m[1]) : undefined;
}

/** Колектор мусить мати експортер у Tempo і вмикати його в pipelines.traces. */
export function checkTempoExporter(collectorYaml) {
  const violations = [];
  if (!/otlp\/tempo:/.test(collectorYaml)) violations.push('колектор без експортера otlp/tempo');
  if (!/exporters:\s*\[[^\]]*otlp\/tempo/.test(collectorYaml)) {
    violations.push('pipelines.traces не експортує в otlp/tempo — трейси не доходять');
  }
  return violations;
}

/** Внутрішній порт Tempo з мапінгу compose `'127.0.0.1:13200:3200'`. */
export function tempoInternalPort(composeSrc) {
  const m = /tempo:[\s\S]{0,400}?-\s*'[\d.]+:\d+:(\d+)'/.exec(composeSrc);
  return m ? Number(m[1]) : undefined;
}

/** Порт з `url: http://tempo:3200` datasource Grafana. */
export function datasourcePort(datasourceYaml) {
  const m = /url:\s*http:\/\/tempo:(\d+)/.exec(datasourceYaml);
  return m ? Number(m[1]) : undefined;
}

function portViolation(label, actual, expected) {
  if (actual === undefined) return [`${label}: порт не знайдено`];
  if (expected === undefined) return [];
  return actual === expected ? [] : [`${label}: ${actual} ≠ ${expected} (очікуваний)`];
}

export function checkWiring(sources) {
  const collectorPort = collectorHttpPort(sources.collector);
  const violations = [
    ...checkOtelImportFirst(sources.main),
    ...portViolation(
      'api OTEL_EXPORTER_OTLP_ENDPOINT',
      apiOtlpPort(sources.compose),
      collectorPort
    ),
    ...portViolation('колектор otlp/http', collectorPort, undefined),
    ...checkTempoExporter(sources.collector),
    ...portViolation(
      'datasource Tempo',
      datasourcePort(sources.datasource),
      tempoInternalPort(sources.compose)
    ),
  ];
  if (!/OTEL_EXPORTER_OTLP_ENDPOINT/.test(sources.otel)) {
    violations.push('otel.ts не читає OTEL_EXPORTER_OTLP_ENDPOINT — експортер не створиться');
  }
  return violations;
}

export function scanProject(rootDir) {
  const violations = [];
  const sources = {};
  for (const [key, rel] of Object.entries(FILES)) {
    const full = path.join(rootDir, rel);
    if (!fs.existsSync(full)) {
      violations.push({ file: rel, message: 'файл відсутній' });
      continue;
    }
    sources[key] = fs.readFileSync(full, 'utf8');
  }
  if (violations.length > 0) return violations;
  return checkWiring(sources).map((message) => ({ file: 'otel-wiring', message }));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const violations = scanProject(root);
  for (const v of violations) console.error(`${v.file}: ${v.message}`);
  if (violations.length > 0) {
    console.error(`otel-wiring: ${violations.length} порушень — трейси не дійдуть до Grafana.`);
    process.exit(1);
  }
  console.log('otel-wiring: api → колектор → Tempo → Grafana звʼязані');
}
