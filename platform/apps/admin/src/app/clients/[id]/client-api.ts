export async function patchVip(clientId: string, percent: number | null) {
  const res = await fetch(`/admin/clients/${clientId}/vip-discount`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ percent, changedBy: 'admin' }),
  });
  if (!res.ok) throw new Error('Failed to save');
}

export async function postNote(
  clientId: string,
  input: { text: string; authorRole: string; visibleToClient: boolean }
) {
  const res = await fetch(`/admin/clients/${clientId}/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, authorId: 'admin' }),
  });
  if (!res.ok) throw new Error('Failed to add note');
  return res.json();
}

export async function deleteNote(clientId: string, noteId: string) {
  const res = await fetch(`/admin/clients/${clientId}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to remove note');
}
