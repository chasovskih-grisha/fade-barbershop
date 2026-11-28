'use client';

import { useEffect, useState } from 'react';

type ShareStatus = 'idle' | 'copied' | 'failed';

const FEEDBACK: Record<Exclude<ShareStatus, 'idle'>, string> = {
  copied: 'Посилання скопійовано',
  failed: 'Не вдалося скопіювати — скопіюйте адресу з рядка браузера',
};

export function LocationShare({ name, code }: { name: string; code: string }) {
  const [status, setStatus] = useState<ShareStatus>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  async function share() {
    const url = new URL(`/locations/${code}`, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus('copied');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setStatus('failed');
    }
  }

  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        onClick={share}
        className="inline-flex h-12 items-center justify-center rounded-input border border-line bg-transparent px-5 font-text text-bodyLg font-medium text-fg transition-colors hover:bg-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
      >
        Поділитися
      </button>
      <span role="status" className="text-caption text-fg-secondary">
        {status === 'idle' ? '' : FEEDBACK[status]}
      </span>
    </span>
  );
}
