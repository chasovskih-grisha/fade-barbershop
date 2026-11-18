'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  giveConsent,
  requestGeneration,
  pollGeneration,
  selectVariant,
  type GenerationStatus,
} from './aiGenerationApi';

type AiState =
  | { status: 'idle' }
  | { status: 'generating' }
  | { status: 'polling'; suggestionId: string }
  | { status: 'ready'; suggestionId: string; variants: GenerationStatus['variants'] }
  | { status: 'error'; error: string };

export function useAiGeneration(sourcePhotoId: string | null) {
  const [state, setState] = useState<AiState>({ status: 'idle' });

  const startGeneration = useCallback(
    async (variantCount = 4) => {
      if (!sourcePhotoId) return;
      setState({ status: 'generating' });
      try {
        await giveConsent(sourcePhotoId);
        const { suggestionId } = await requestGeneration(sourcePhotoId, variantCount);
        setState({ status: 'polling', suggestionId });
      } catch (e: unknown) {
        setState({ status: 'error', error: e instanceof Error ? e.message : 'Помилка генерації' });
      }
    },
    [sourcePhotoId]
  );

  // Витягнуто в змінну, щоб deps був статично перевірюваним (exhaustive-deps).
  const pollingSuggestionId = state.status === 'polling' ? state.suggestionId : null;

  useEffect(() => {
    if (!pollingSuggestionId) return;
    const timer = setInterval(async () => {
      try {
        const data = await pollGeneration(pollingSuggestionId);
        if (data.status === 'ready') {
          setState({
            status: 'ready',
            suggestionId: pollingSuggestionId,
            variants: data.variants,
          });
        } else if (data.status === 'failed') {
          setState({ status: 'error', error: `${data.failureReason}: ${data.errorMessage}` });
        }
      } catch {
        setState({ status: 'error', error: 'Помилка поллінгу' });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [pollingSuggestionId]);

  const handleSelect = useCallback(
    async (objectKey: string) => {
      if (!('suggestionId' in state)) return;
      await selectVariant(state.suggestionId, objectKey);
    },
    [state]
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, startGeneration, handleSelect, reset };
}
