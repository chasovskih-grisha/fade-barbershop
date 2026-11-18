// Юніт-тест конвеєра публічного медіа (T-4609a): WebP-вихід, SVG-растеризація,
// чітка відмова на байтах без зображення.
import sharp from 'sharp';
import { toWebp } from './media-pipeline';
import { MediaProcessingError } from './public-media-storage';

const png = () =>
  sharp({ create: { width: 32, height: 16, channels: 3, background: '#111111' } })
    .png()
    .toBuffer();

describe('toWebp', () => {
  it('PNG → WebP (RIFF/WEBP-магія)', async () => {
    const out = await toWebp(await png());
    expect(out.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(out.subarray(8, 12).toString('ascii')).toBe('WEBP');
  });

  it('SVG бренду растерізується, без розширення більшого за межі', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>';
    const out = await toWebp(new TextEncoder().encode(svg), {
      width: 256,
      height: 256,
      fit: 'cover',
    });
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('webp');
    // withoutEnlargement: 8px не роздувається до 256.
    expect(meta.width).toBe(8);
  });

  it('cover зберігає задані межі (crop за потреби)', async () => {
    const out = await toWebp(await png(), { width: 8, height: 8, fit: 'cover' });
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(8);
    expect(meta.height).toBe(8);
  });

  it('биті байти і порожній файл → MediaProcessingError', async () => {
    await expect(toWebp(new TextEncoder().encode('not an image'))).rejects.toThrow(
      MediaProcessingError
    );
    await expect(toWebp(new Uint8Array())).rejects.toThrow(MediaProcessingError);
  });
});
