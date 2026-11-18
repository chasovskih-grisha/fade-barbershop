// Розмір зображення з байтів (AI-WEB-01): читає заголовки PNG/JPEG, щоб
// валідація завантаження відкидала замале фото до звернення до сховища.
import { readPhotoDimensions } from './photo-dimensions';

/** Мінімальний PNG з потрібними розмірами (сигнатура + IHDR-заголовок). */
function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

/** Мінімальний JPEG із SOF0-маркером, що несе розміри кадру. */
function jpeg(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array([
    0xff,
    0xd8, // SOI
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08, // SOF0, довжина, точність
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x00,
  ]);
  return bytes;
}

describe('readPhotoDimensions', () => {
  it('читає ширину й висоту з PNG', () => {
    expect(readPhotoDimensions(png(800, 1024))).toEqual({ width: 800, height: 1024 });
  });

  it('читає ширину й висоту з JPEG', () => {
    expect(readPhotoDimensions(jpeg(1200, 900))).toEqual({ width: 1200, height: 900 });
  });

  it('повертає null для нерозпізнаного формату', () => {
    expect(readPhotoDimensions(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
