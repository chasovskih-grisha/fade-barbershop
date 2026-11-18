// HTTP-клієнт Gemini image edit (ACL, ADR 0008). Ключ лише з env, у логи не пишеться.
// Модель за замовчуванням — gemini-2.5-flash-image (редагування портрета).

import { GeminiImageError } from './gemini-image.error';
import { parseGeminiImage, type ParsedGeminiImage } from './gemini-image.parse';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash-image';
const TIMEOUT_MS = 90_000;

export interface GeminiEditInput {
  bytes: Uint8Array;
  contentType: string;
  prompt: string;
}

export interface GeminiImageClient {
  edit(input: GeminiEditInput): Promise<ParsedGeminiImage>;
}

export function createGeminiImageClient(options: {
  apiKey: string;
  model?: string | undefined;
  fetchImpl?: typeof fetch | undefined;
}): GeminiImageClient {
  const model = options.model || DEFAULT_MODEL;
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    edit: (input) => editImage({ fetchImpl, apiKey: options.apiKey, model, input }),
  };
}

async function editImage(options: {
  fetchImpl: typeof fetch;
  apiKey: string;
  model: string;
  input: GeminiEditInput;
}): Promise<ParsedGeminiImage> {
  const { fetchImpl, apiKey, model, input } = options;
  if (!apiKey) throw new GeminiImageError('unknown', 'GEMINI_API_KEY is not set');
  const response = await fetchImpl(`${ENDPOINT}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(requestBody(input)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw mapTransport(error);
  });
  if (!response.ok) throw await mapStatus(response);
  return parseGeminiImage(await response.json());
}

function requestBody(input: GeminiEditInput) {
  return {
    contents: [
      {
        role: 'user',
        parts: [
          { text: input.prompt },
          {
            inlineData: {
              mimeType: input.contentType,
              data: Buffer.from(input.bytes).toString('base64'),
            },
          },
        ],
      },
    ],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
}

function mapTransport(error: unknown): GeminiImageError {
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return new GeminiImageError('provider_timeout', 'Gemini request timed out');
  }
  return new GeminiImageError('unknown', 'Gemini request failed');
}

async function mapStatus(response: Response): Promise<GeminiImageError> {
  if (response.status === 429)
    return new GeminiImageError('provider_quota', 'Gemini quota exceeded');
  if (response.status === 408 || response.status === 504) {
    return new GeminiImageError('provider_timeout', 'Gemini request timed out');
  }
  if (response.status === 400)
    return new GeminiImageError('invalid_photo', 'Gemini rejected the photo');
  return new GeminiImageError('unknown', `Gemini HTTP ${response.status}`);
}
