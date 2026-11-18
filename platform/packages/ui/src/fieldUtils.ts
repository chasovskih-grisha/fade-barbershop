export function messageIds(id: string, help?: string, error?: string) {
  const helpId = help && !error ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
  return { helpId, errorId, describedBy };
}
