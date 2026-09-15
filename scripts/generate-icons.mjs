// Generates PWA/app icons as real PNG files using only Node's built-in zlib.
// No image libraries are available in this environment, so we build the
// PNG byte-for-byte: a rounded-square background with a checkmark mark.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function roundedRectMask(x, y, s, radius) {
  const nx = x < radius ? radius : x > s - radius ? s - radius : x;
  const ny = y < radius ? radius : y > s - radius ? s - radius : y;
  if ((x === nx) || (y === ny)) return true;
  return Math.hypot(x - nx, y - ny) <= radius;
}

function makeIcon(size, { padding = 0 } = {}) {
  const s = size;
  const bg = [16, 163, 127]; // brand teal-green
  const white = [255, 255, 255];
  const radius = s * 0.22;
  const stroke = s * 0.09;
  const inner = s - padding * 2;

  const raw = Buffer.alloc((s * 4 + 1) * s);
  let offset = 0;
  for (let y = 0; y < s; y++) {
    raw[offset++] = 0; // filter type: none
    for (let x = 0; x < s; x++) {
      const lx = x - padding;
      const ly = y - padding;
      let r = 0, g = 0, b = 0, a = 0;
      if (padding === 0 || (lx >= 0 && ly >= 0 && lx < inner && ly < inner)) {
        const rx = padding === 0 ? x : lx;
        const ry = padding === 0 ? y : ly;
        const rs = padding === 0 ? s : inner;
        if (roundedRectMask(rx, ry, rs, radius)) {
          [r, g, b] = bg;
          a = 255;
          // checkmark, drawn in the local (unpadded) icon space
          const p1 = [rs * 0.27, rs * 0.53];
          const p2 = [rs * 0.44, rs * 0.71];
          const p3 = [rs * 0.75, rs * 0.32];
          const d1 = distToSegment(rx, ry, p1[0], p1[1], p2[0], p2[1]);
          const d2 = distToSegment(rx, ry, p2[0], p2[1], p3[0], p3[1]);
          const strokeLocal = (rs / s) * stroke;
          if (Math.min(d1, d2) < strokeLocal / 2) {
            [r, g, b] = white;
          }
        }
      }
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', makeIcon(192));
writeFileSync('public/icons/icon-512.png', makeIcon(512));
writeFileSync('public/icons/icon-maskable-512.png', makeIcon(512, { padding: 512 * 0.15 }));
writeFileSync('public/icons/apple-touch-icon.png', makeIcon(180));
console.log('Icons generated in public/icons/');
