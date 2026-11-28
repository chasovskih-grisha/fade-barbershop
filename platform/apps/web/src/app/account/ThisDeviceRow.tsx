'use client';

import Link from 'next/link';
import { CHANNEL_LABEL, otherDevicesLabel } from './devices/labels';
import type { ThisDevice } from './useThisDevice';

/** Рядок «Цей пристрій» у секції «Акаунт» (T-4724b): канал + перехід на пристрої. */
export function ThisDeviceRow({ device }: { device: ThisDevice }) {
  const others = otherDevicesLabel(device.others);

  return (
    <div
      data-testid="this-device-row"
      className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-body-s text-fg-secondary"
    >
      <Link
        href="/account/devices"
        className="inline-flex min-h-11 items-center font-text text-body font-medium text-accent-blue underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
      >
        Цей пристрій
      </Link>
      {device.channel ? <span>{CHANNEL_LABEL[device.channel]}</span> : null}
      {others ? <span>· {others}</span> : null}
    </div>
  );
}
