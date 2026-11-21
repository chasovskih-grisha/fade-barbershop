// Тести гейта звʼязки трейсингу (T-4801).
//
// Гейт мусить червоніти на кожній із чотирьох типових поломок (імпорт не
// перший, порт api ≠ колектор, колектор без експортера Tempo, порт datasource
// ≠ Tempo) і зеленіти на реальному дереві. Фікстури — в памʼяті, без Docker.
// Запуск: `pnpm otel:test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkOtelImportFirst,
  checkTempoExporter,
  checkWiring,
  collectorHttpPort,
  datasourcePort,
  scanProject,
} from './check-otel-wiring.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COLLECTOR = [
  'receivers:',
  '  otlp:',
  '    protocols:',
  '      http:',
  '        endpoint: 0.0.0.0:4318',
  'exporters:',
  '  otlp/tempo:',
  '    endpoint: tempo:4317',
  'service:',
  '  pipelines:',
  '    traces:',
  '      exporters: [otlp/tempo]',
].join('\n');
const COMPOSE = [
  '  api:',
  '    environment:',
  '      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318',
  '  tempo:',
  '    ports:',
  "      - '127.0.0.1:13200:3200'",
].join('\n');
const DATASOURCE = 'datasources:\n  - url: http://tempo:3200\n';

test('перший import — ./otel: чисто', () => {
  assert.deepEqual(checkOtelImportFirst("import './otel';\nimport 'reflect-metadata';"), []);
});

test('otel не перший import — порушення', () => {
  const v = checkOtelImportFirst("import 'reflect-metadata';\nimport './otel';");
  assert.equal(v.length, 1);
  assert.match(v[0], /перший import/);
});

test('порти колектора і datasource читаються', () => {
  assert.equal(collectorHttpPort(COLLECTOR), 4318);
  assert.equal(datasourcePort(DATASOURCE), 3200);
});

test('колектор без експортера otlp/tempo — порушення', () => {
  assert.equal(checkTempoExporter('exporters:\n  debug:').length, 2);
});

test('повна звʼязка — чисто', () => {
  const violations = checkWiring({
    main: "import './otel';",
    otel: 'const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;',
    compose: COMPOSE,
    collector: COLLECTOR,
    datasource: DATASOURCE,
  });
  assert.deepEqual(violations, []);
});

test('порт api не збігається з колектором — порушення', () => {
  const violations = checkWiring({
    main: "import './otel';",
    otel: 'process.env.OTEL_EXPORTER_OTLP_ENDPOINT',
    compose: COMPOSE.replace(':4318', ':4317'),
    collector: COLLECTOR,
    datasource: DATASOURCE,
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /4317/);
});

test('порт datasource не збігається з Tempo — порушення', () => {
  const violations = checkWiring({
    main: "import './otel';",
    otel: 'process.env.OTEL_EXPORTER_OTLP_ENDPOINT',
    compose: COMPOSE,
    collector: COLLECTOR,
    datasource: 'url: http://tempo:3201',
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /datasource Tempo/);
});

test('реальне дерево платформи звʼязане', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  assert.deepEqual(scanProject(root), []);
});
