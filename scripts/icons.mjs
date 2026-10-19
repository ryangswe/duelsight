// SPDX-License-Identifier: Apache-2.0
// DuelSight's placeholder icon: a plain light card, tilted, with a violet picture box, on a dark
// rounded square, PNG encoded by hand with zlib. Deliberately generic: no publisher imagery, no
// card-back art. Replace it when the project has a real mark.
// `node scripts/icons.mjs` writes it to icons/ (the folder duelsight.config.json names); the
// build copies whatever PNG files that folder holds.

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** Coverage of a pixel by a shape, by 4 x 4 supersampling. */
function coverage(inside, x, y) {
  let n = 0;
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) if (inside(x + (i + 0.5) / 4, y + (j + 0.5) / 4)) n += 1;
  return n / 16;
}

export function iconPng(size) {
  const s = size;
  const r = s * 0.22;
  const square = (x, y) => {
    const dx = Math.max(r - x, 0, x - (s - r));
    const dy = Math.max(r - y, 0, y - (s - r));
    return dx * dx + dy * dy <= r * r;
  };
  // A tilted card (63 x 88 proportions) with a picture box and a text line, and a pointer dot.
  const cx = s / 2;
  const cy = s / 2;
  const angle = (-12 * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const toCard = (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    return [dx * cos + dy * sin, -dx * sin + dy * cos];
  };
  const rounded = (hw, hh, rr) => (u, v) => {
    const ex = Math.max(Math.abs(u) - (hw - rr), 0);
    const ey = Math.max(Math.abs(v) - (hh - rr), 0);
    return ex * ex + ey * ey <= rr * rr;
  };
  const cardH = s * 0.64;
  const cardW = (cardH * 63) / 88;
  const cardShape = rounded(cardW / 2, cardH / 2, s * 0.05);
  const card = (x, y) => cardShape(...toCard(x, y));
  const art = (x, y) => {
    const [u, v] = toCard(x, y);
    return Math.abs(u) <= cardW * 0.38 && v >= -cardH * 0.4 && v <= cardH * 0.1;
  };
  const line = (x, y) => {
    const [u, v] = toCard(x, y);
    return Math.abs(u) <= cardW * 0.38 && v >= cardH * 0.2 && v <= cardH * 0.2 + Math.max(s * 0.04, 1);
  };
  const dot = (x, y) => (x - cx - s * 0.2) ** 2 + (y - cy + s * 0.22) ** 2 <= (s * 0.1) ** 2;
  const raw = Buffer.alloc(s * (1 + s * 4));
  for (let y = 0; y < s; y += 1) {
    raw[y * (1 + s * 4)] = 0;
    for (let x = 0; x < s; x += 1) {
      const bg = coverage(square, x, y);
      const e = coverage(card, x, y);
      const i = coverage(art, x, y);
      const p = coverage(line, x, y);
      const d = coverage(dot, x, y);
      // Layers, bottom up: dark square, light card, violet picture box, grey text line, white dot.
      let rgb = [24, 22, 36];
      const mix = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);
      rgb = mix(rgb, [236, 232, 248], e);
      rgb = mix(rgb, [124, 92, 255], i);
      rgb = mix(rgb, [150, 146, 170], p);
      rgb = mix(rgb, [255, 255, 255], d);
      const o = y * (1 + s * 4) + 1 + x * 4;
      raw[o] = Math.round(rgb[0]);
      raw[o + 1] = Math.round(rgb[1]);
      raw[o + 2] = Math.round(rgb[2]);
      raw[o + 3] = Math.round(bg * 255);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(s, 0);
  header.writeUInt32BE(s, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

export const ICON_SIZES = [16, 32, 48, 128];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = new URL("../icons/", import.meta.url);
  mkdirSync(dir, { recursive: true });
  for (const size of ICON_SIZES) writeFileSync(new URL(`icon-${size}.png`, dir), iconPng(size));
  console.log(`icons/: ${ICON_SIZES.map((s) => `icon-${s}.png`).join(", ")}`);
}
