// Клієнтські PATCH-запити каталогу послуг (редагування в рядку) — винесені з
// ServicesTable за LOC-гейт (ADR 0019). Повідомлення помилок — ті самі.
async function patch(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Зміна полів послуги (назва/категорія/тривалість/активність). */
export async function patchService(
  serviceId: string,
  changes: Record<string, unknown>,
  onError: (message: string) => void
): Promise<boolean> {
  const response = await patch(`/admin/services/${serviceId}`, changes);
  if (!response.ok) {
    onError('Не вдалося зберегти послугу');
    return false;
  }
  return true;
}

/** Зміна ціни послуги в локації. */
export async function patchPrice(
  input: { serviceId: string; locationId: string; amount: number; active: boolean },
  onError: (message: string) => void
): Promise<boolean> {
  const response = await patch(`/admin/services/${input.serviceId}/prices/${input.locationId}`, {
    amount: input.amount,
    active: input.active,
  });
  if (!response.ok) {
    onError('Вкажіть додатну ціну та перевірте локацію');
    return false;
  }
  return true;
}
