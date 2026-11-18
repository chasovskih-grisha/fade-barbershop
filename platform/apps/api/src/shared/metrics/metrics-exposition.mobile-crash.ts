// Краш-секція застосунку (T-4443) для Prometheus: лічильники класу краху за
// версією і платформою. Окремий файл — тримає buildMetricsExposition під гейтом
// max-lines і complexity.
export function mobileCrashLines(samples: Record<string, Record<string, number>>): string[] {
  const out: string[] = [
    '# HELP fade_mobile_crashes_total Mobile app crash reports by class, version and platform (T-4443).',
    '# TYPE fade_mobile_crashes_total counter',
  ];
  for (const [crashClass, versions] of Object.entries(samples)) {
    for (const [versionPlatform, value] of Object.entries(versions)) {
      const [appVersion, platform] = versionPlatform.split('|');
      out.push(
        'fade_mobile_crashes_total{crash_class="' +
          crashClass +
          '",app_version="' +
          (appVersion ?? 'unknown') +
          '",platform="' +
          (platform ?? 'unknown') +
          '"} ' +
          value
      );
    }
  }
  return out;
}
