'use client';

// Банер причини для вимкненої локації (§1.1, T-4525a): власник бачить, чому
// точка недоступна, без відкриття форми.
import { AlertBanner } from '@fade/ui';

export default function InactiveLocationBanner({ active }: { active: boolean }) {
  if (active) return null;
  return (
    <AlertBanner tone="warning" title="Локація вимкнена">
      Локація не з’являється на сайті й не приймає нових записів. Наявні візити залишаються в силі.
    </AlertBanner>
  );
}
