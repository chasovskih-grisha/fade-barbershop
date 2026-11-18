// Хук політики слотів локації (T-4522): завантаження, валідація діапазонів,
// confirm-крок перед збереженням (зміна застосовується лише до нових записів).
import { useCallback, useEffect, useState } from 'react';
import { POLICY_DEFAULTS, validatePolicy, type PolicyValues } from './slot-policy-fields';

type PolicyDto = PolicyValues & { locationId: string; usingDefaults: boolean };

const endpoint = (locationId: string) =>
  `/admin/barber-service/locations/${locationId}/slot-policy`;

export function useSlotPolicy(locationId: string) {
  const [values, setValues] = useState<PolicyValues>(POLICY_DEFAULTS);
  const [usingDefaults, setUsingDefaults] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(endpoint(locationId), { credentials: 'include' });
    if (!response.ok) throw new Error('Не вдалося завантажити політику слотів');
    const data = (await response.json()) as PolicyDto;
    setValues({
      stepMinutes: data.stepMinutes,
      bufferMinutes: data.bufferMinutes,
      horizonDays: data.horizonDays,
      lastMinuteMinutes: data.lastMinuteMinutes,
    });
    setUsingDefaults(data.usingDefaults);
  }, [locationId]);

  useEffect(() => {
    load().catch((cause) =>
      setError(cause instanceof Error ? cause.message : 'Не вдалося завантажити політику слотів')
    );
  }, [load]);

  const setField = (field: keyof PolicyValues, raw: number) => {
    setValues((prev) => ({ ...prev, [field]: raw }));
    setConfirming(false);
    setNotice('');
    setError(null);
  };

  const requestSave = () => {
    const invalid = validatePolicy(values);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setConfirming(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(endpoint(locationId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Не вдалося зберегти політику слотів');
      }
      const saved = (await response.json()) as PolicyDto;
      setUsingDefaults(saved.usingDefaults);
      setConfirming(false);
      setNotice('Політику збережено — зміна застосується лише до нових записів.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти політику слотів');
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  return {
    values,
    usingDefaults,
    error,
    notice,
    confirming,
    saving,
    setField,
    requestSave,
    confirmSave,
    cancel: () => setConfirming(false),
  };
}
