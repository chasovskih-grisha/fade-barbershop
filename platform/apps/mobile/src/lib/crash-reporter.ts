// Адаптер краш-коридору (T-4443): додає контекст пристрою (версія, платформа)
// до чистого ядра crash-report і шле маяк у POST /telemetry/mobile-crash.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiBase } from './api/api-base';
import { buildCrashReport, createHttpCrashReporter } from './crash-report';

const reporter = createHttpCrashReporter({
  endpoint: `${apiBase()}/telemetry/mobile-crash`,
  fetchImpl: (...args) => fetch(...args),
});

/** Надсилає мінімальний звіт про крах; без fetch або збій мережі — тихо. */
export async function reportCrash(error: { name?: string; message?: string }): Promise<void> {
  if (typeof fetch !== 'function') return;
  await reporter.report(
    buildCrashReport(error, {
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      platform: Platform.OS,
      occurredAt: new Date().toISOString(),
    })
  );
}
