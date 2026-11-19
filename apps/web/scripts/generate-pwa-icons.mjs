/**
 * Writes solid navy placeholder PNGs for the PWA.
 * Replace the files under public/icons before launch (see public/icons/README.md).
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/icons');

const NAVY = [0x0f, 0x15, 0x45, 0xff];
const ORANGE = [0xff, 0x75, 0x00, 0xff];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function png(size, { maskable = false } = {}) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const margin = maskable ? Math.floor(size * 0.1) : Math.floor(size * 0.28);
  const inner = size - margin * 2;

  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const i = row + 1 + x * 4;
      const inSafe =
        x >= margin && x < size - margin && y >= margin && y < size - margin;
      const dx = x - size / 2;
      const dy = y - size / 2;
      const r = Math.sqrt(dx * dx + dy * dy);
      const ring = Math.abs(r - inner * 0.28) < size * 0.035;
      const color = inSafe && ring ? ORANGE : NAVY;
      raw[i] = color[0];
      raw[i + 1] = color[1];
      raw[i + 2] = color[2];
      raw[i + 3] = color[3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'icon-192.png'), png(192));
writeFileSync(join(outDir, 'icon-512.png'), png(512));
writeFileSync(join(outDir, 'icon-maskable-512.png'), png(512, { maskable: true }));
console.log('Wrote placeholder PWA icons to', outDir);
