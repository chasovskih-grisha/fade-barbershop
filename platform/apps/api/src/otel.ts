// OpenTelemetry tracing (T-4204f): найперший імпорт застосунку — реєстрація
// SDK ДО будь-якого http-коду, щоб auto-instrumentations обгорнув модулі.
// Канал — OTLP/HTTP на колектор obs-профілю (infra/otel-collector/otel.yml);
// без OTEL_EXPORTER_OTLP_ENDPOINT SDK живе, але нічого не експортує. Семплінг
// — parent-based always_on у dev; прод-семплінг (head 10% / tail 100% помилок)
// — окреме рішення T-4204. W3C TraceContext — дефолт пропагатора.
// OTel JS v2: resource — фабрика resourceFromAttributes (не конструктор).
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (process.env.OTEL_SDK_LOG_LEVEL === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// exactOptionalPropertyTypes: не передаємо ключ із undefined — розгортаємо умовно.
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'fade-api',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
  }),
  ...(endpoint ? { traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }) } : {}),
  instrumentations: [
    getNodeAutoInstrumentations({
      // fs тягне шум з логера/Prisma-стора — трейсимо лише мережу/клієнтів.
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  void sdk.shutdown();
});
process.on('SIGINT', () => {
  void sdk.shutdown();
});
