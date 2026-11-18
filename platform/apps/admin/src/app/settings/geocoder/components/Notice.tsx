'use client';

interface Props {
  notice: string | null;
}

export function Notice({ notice }: Props) {
  if (!notice) return null;
  return (
    <p role="status" className="text-sm text-fg-secondary">
      {notice}
    </p>
  );
}
