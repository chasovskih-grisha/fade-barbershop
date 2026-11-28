import { render, screen } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import React from 'react';
import AccountPage from './page';

export const storedNotifications = {
  smsReminders: true,
  emailUpdates: true,
  pushNotifications: false,
  marketingOffers: false,
};

export type FetchHandler = (url: string, init?: RequestInit) => Promise<unknown> | undefined;

export function mockFetch(onNotifications?: FetchHandler) {
  global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url.includes('/api/account/notifications')) {
      const custom = onNotifications?.(url, init);
      if (custom) return custom;
      if (init?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: async () => JSON.parse(String(init.body)) });
      }
      return Promise.resolve({ ok: true, json: async () => storedNotifications });
    }
    if (url.includes('/haircut-ai/assets')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
  }) as unknown as typeof fetch;
}

export function renderAccountPage(): RenderResult {
  return render(<AccountPage />);
}

export function smsToggle() {
  return screen.getAllByRole('checkbox', { name: /SMS-нагадування/i })[0] as HTMLInputElement;
}

export function marketingToggle() {
  return screen.getAllByRole('checkbox', {
    name: /Маркетингові пропозиції/i,
  })[0] as HTMLInputElement;
}

export function lastPatchBody(): Record<string, unknown> {
  const calls = (global.fetch as unknown as jest.Mock).mock.calls;
  const patch = calls.find(([, init]) => init?.method === 'PATCH');
  return JSON.parse(String(patch?.[1]?.body));
}
