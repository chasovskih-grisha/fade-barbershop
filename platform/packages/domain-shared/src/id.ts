import { randomBytes } from 'crypto';

export type DomainId<T extends string> = string & { readonly __brand: T };

let lastMs = 0;
let sequence = 0;

export function uuidv7(): string {
  let ms = Date.now();
  if (ms > lastMs) {
    lastMs = ms;
    sequence = randomBytes(2).readUInt16BE(0) & 0x0fff;
  } else {
    sequence = (sequence + 1) & 0x0fff;
    if (sequence === 0) {
      lastMs++;
      ms = lastMs;
    }
  }

  const buf = Buffer.alloc(16);
  buf.writeUIntBE(Math.floor(ms / 0x100000000), 0, 4);
  buf.writeUInt32BE(ms >>> 0, 4);

  const b6 = 0x70 | ((sequence >> 8) & 0x0f);
  const b7 = sequence & 0xff;
  buf[6] = b6;
  buf[7] = b7;

  randomBytes(8).copy(buf, 8);
  const b8 = buf[8] ?? 0;
  buf[8] = (b8 & 0x3f) | 0x80;

  const hex = buf.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
