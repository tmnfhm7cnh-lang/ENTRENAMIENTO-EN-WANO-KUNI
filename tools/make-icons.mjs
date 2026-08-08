/**
 * Generates the PWA icons as real PNG files.
 *
 * iOS ignores SVG for `apple-touch-icon` and falls back to a screenshot of the
 * page, which looks like a mistake on the home screen. There is no image
 * library in this project on purpose, so the PNGs are encoded by hand: raw
 * RGBA scanlines, deflated with node's built-in zlib, wrapped in the three
 * chunks a valid PNG needs (IHDR, IDAT, IEND).
 *
 * Run with: node tools/make-icons.mjs
 */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(HERE, "..", "public");

// Palette lifted from src/index.css so the icon matches the app.
const INK = [26, 10, 18];        // #1a0a12 tinta cálida
const SAKURA = [249, 208, 222];  // #f9d0de
const SAKURA_DEEP = [232, 160, 184]; // #e8a0b8
const GOLD = [232, 201, 122];    // #e8c97a

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  // Each scanline is prefixed with its filter byte; 0 = none.
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * A sakura blossom, built as the union of five overlapping discs.
 *
 * A rose curve (r = a + b·cos 5θ) was the first attempt and it renders spiky
 * petals with deep notches — it reads as a daisy, not a cherry blossom. Five
 * fat discs pushed out from the centre give the rounded, overlapping petals
 * the real flower has.
 */
function renderIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;

  const PETAL_DIST = radius * 0.52;   // how far each petal sits from the centre
  const PETAL_RADIUS = radius * 0.46; // how fat each petal is
  const petals = Array.from({ length: 5 }, (_, i) => {
    // -90° so one petal points straight up.
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(angle) * PETAL_DIST, Math.sin(angle) * PETAL_DIST];
  });

  // Supersample so the petal edges are not jagged at 180px.
  const SS = 3;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let petal = 0;
      let core = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS - cx;
          const py = y + (sy + 0.5) / SS - cy;
          const dist = Math.hypot(px, py);

          const inPetal =
            dist <= radius * 0.3 || // fill the middle so the five discs join up
            petals.some(([ox, oy]) => Math.hypot(px - ox, py - oy) <= PETAL_RADIUS);

          if (inPetal) petal++;
          if (dist <= radius * 0.17) core++;
        }
      }

      const total = SS * SS;
      const petalA = petal / total;
      const coreA = core / total;

      // Background: a soft radial warm-ink field, not a flat fill.
      const d = Math.hypot(x - cx, y - cy) / (size / 2);
      let rgb = mix(mix(INK, [58, 16, 40], 0.55), INK, Math.min(1, d));

      if (petalA > 0) {
        // Petals shade from deep sakura at the rim to pale at the centre.
        const shade = Math.min(1, Math.hypot(x - cx, y - cy) / radius);
        const petalColor = mix(SAKURA, SAKURA_DEEP, shade);
        rgb = mix(rgb, petalColor, petalA);
      }
      if (coreA > 0) rgb = mix(rgb, GOLD, coreA);

      const i = (y * size + x) * 4;
      buf[i] = rgb[0];
      buf[i + 1] = rgb[1];
      buf[i + 2] = rgb[2];
      buf[i + 3] = 255;
    }
  }

  return encodePng(size, size, buf);
}

mkdirSync(PUBLIC_DIR, { recursive: true });
for (const size of [180, 192, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  const png = renderIcon(size);
  writeFileSync(join(PUBLIC_DIR, name), png);
  console.log(`${name}  ${size}x${size}  ${png.length} bytes`);
}
