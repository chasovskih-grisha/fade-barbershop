'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ClientDetail } from './client-types';
import { postNote, deleteNote } from './client-api';

type SetClient = Dispatch<SetStateAction<ClientDetail | null>>;

/** Нотатки клієнта: стан модалки + add/remove. saving спільний із VIP-формою. */
export function useClientNotes(
  client: ClientDetail | null,
  setClient: SetClient,
  setSaving: (saving: boolean) => void
) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteAuthorRole, setNoteAuthorRole] = useState<'barber' | 'admin'>('admin');
  const [noteVisibleToClient, setNoteVisibleToClient] = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim() || !client) return;
    setSaving(true);
    try {
      const data = await postNote(client.id, {
        text: noteText,
        authorRole: noteAuthorRole,
        visibleToClient: noteVisibleToClient,
      });
      setClient(data.client);
      setNoteText('');
      setShowNoteModal(false);
    } catch {
      alert('Не вдалося додати нотатку');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveNote = async (noteId: string) => {
    if (!client) return;
    try {
      await deleteNote(client.id, noteId);
      setClient((c) => (c ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : null));
    } catch {
      alert('Не вдалося видалити нотатку');
    }
  };

  return {
    showNoteModal,
    setShowNoteModal,
    noteText,
    setNoteText,
    noteAuthorRole,
    setNoteAuthorRole,
    noteVisibleToClient,
    setNoteVisibleToClient,
    handleAddNote,
    handleRemoveNote,
  };
}
