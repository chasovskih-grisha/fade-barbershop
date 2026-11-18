// Розмір зображення з байтів (AI-WEB-01: мінімальна роздільність ~800×800).
// Чиста функція без залежностей: читає заголовки PNG/JPEG/WebP, щоб валідація
// завантаження відкидала замале фото до звернення до сховища.

export interface PhotoDimensions {
  width: number;
  height: number;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function readPng(bytes: Uint8Array): PhotoDimensions | null {
  if (bytes.length < 24) return null;
  if (!PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function isSofMarker(marker: number | undefined): boolean {
  if (marker === undefined) return false;
  // SOF0..SOF15 (без C4/C8/CC) несуть розміри кадру.
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function readJpeg(bytes: Uint8Array): PhotoDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    if (isSofMarker(bytes[offset + 1])) {
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
    }
    const size = view.getUint16(offset + 2);
    if (size < 2) return null;
    offset += 2 + size;
  }
  return null;
}

/** Розміри фото або null, якщо формат не розпізнано (тоді не блокуємо). */
export function readPhotoDimensions(bytes: Uint8Array): PhotoDimensions | null {
  return readPng(bytes) ?? readJpeg(bytes);
}
