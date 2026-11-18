// Розбір відповіді Gemini generateContent: шукаємо inline-зображення,
// сирий JSON далі не зберігається (ADR 0008).

import { GeminiImageError } from './gemini-image.error';

export interface ParsedGeminiImage {
  bytes: Uint8Array;
  contentType: string;
}

export function parseGeminiImage(payload: unknown): ParsedGeminiImage {
  const parts = partsOf(payload);
  for (const part of parts) {
    const image = inlineImage(part);
    if (image) return image;
  }
  if (blocked(payload)) throw new GeminiImageError('invalid_photo', 'Gemini blocked the photo');
  throw new GeminiImageError('unknown', 'Gemini returned no image');
}

function partsOf(payload: unknown): readonly Record<string, unknown>[] {
  const root = record(payload);
  const candidates = root?.candidates;
  if (!Array.isArray(candidates)) return [];
  const content = record(record(candidates[0])?.content);
  const parts = content?.parts;
  if (!Array.isArray(parts)) return [];
  return parts.map(record).filter((part): part is Record<string, unknown> => part !== null);
}

function inlineImage(part: Record<string, unknown>): ParsedGeminiImage | null {
  const camel = record(part.inlineData);
  const snake = record(part.inline_data);
  const data = stringOf(camel?.data) ?? stringOf(snake?.data);
  if (!data) return null;
  const contentType = stringOf(camel?.mimeType) ?? stringOf(snake?.mime_type) ?? 'image/png';
  return { bytes: Buffer.from(data, 'base64'), contentType };
}

function blocked(payload: unknown): boolean {
  const reason = stringOf(record(arrayItem(record(payload)?.candidates, 0))?.finishReason);
  return reason === 'SAFETY' || reason === 'IMAGE_SAFETY';
}

function arrayItem(value: unknown, index: number): unknown {
  return Array.isArray(value) ? value[index] : undefined;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function stringOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
