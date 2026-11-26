'use client';

// T-4616b: список відкритих конфліктів недоступності барбера. Один список на
// день, не банер у сітці: засновник бачить кожен візит і вирішує окремо —
// перенести на іншого барбера або скасувати (гроші йдуть за політикою депозиту).
import { useCallback, useEffect, useState } from 'react';
import { Card } from '@fade/ui';
import { ConflictRowItem, type ShiftConflictRow } from './ShiftConflictRow';

function settlementNotice(body: unknown): string | null {
  const settlements = (body as { settlements?: Array<{ outcome: string }> }).settlements;
  const refunded = settlements?.some(
    (entry) => entry.outcome === 'refund_initiated' || entry.outcome === 'refund_replayed'
  );
  return refunded ? 'Візит скасовано, депозит повертається' : 'Рішення збережено';
}

export function ShiftConflictsPanel() {
  const [rows, setRows] = useState<ShiftConflictRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/admin/shift-conflicts', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as ShiftConflictRow[];
      setRows(Array.isArray(body) ? body : []);
      setError(null);
    } catch {
      setError('Не вдалося завантажити конфлікти');
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/admin/shift-conflicts/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotice(settlementNotice(await res.json()));
      await load();
    } catch {
      setNotice('Рішення не збереглося — спробуйте ще раз');
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0 && !error) return null;

  return (
    <Card className="p-5">
      <h2 className="mb-3 text-bodyLg font-semibold">Конфлікти недоступності</h2>
      {error && (
        <p role="alert" className="mb-2 text-sm">
          {error}
        </p>
      )}
      {notice && <p className="mb-2 text-sm">{notice}</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <ConflictRowItem
            key={row.id}
            row={row}
            busy={busyId === row.id}
            onCancel={() => void resolve(row.id, { decision: 'cancel' })}
            onReassign={(slot) => void resolve(row.id, { decision: 'reassign', ...slot })}
          />
        ))}
      </ul>
    </Card>
  );
}
