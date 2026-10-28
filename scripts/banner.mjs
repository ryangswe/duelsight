// SPDX-License-Identifier: Apache-2.0
// The README banner, docs/banner.webp (1400×560): the marquee promo tile's layout from
// scripts/store-templates.mjs, over one frame of the promo reel's committed footage, where the
// extension's tooltip shows a card it named (the footage is already cropped and blurred).
//
//   ffmpeg -i tools/promo-video/public/footage/hero.mp4 -vf "select=eq(n\,270)" -frames:v 1 <frame.png>
//   npm install --no-save puppeteer-core
//   node scripts/banner.mjs --chrome "<Chrome for Testing binary>" --frame <frame.png> --tooltip 634,420,580,463 --out docs/banner.webp
//
// --tooltip is the tooltip's box in the frame's pixels (x, y, width, height). Frame 270 of hero.mp4
// is Dracotail Arthalion on Konami's Master Duel Challenger Cup broadcast; its box is the hover's
// `box` in tools/promo-video/scripts/hover-times.json, less the footage's crop. The banner is cropped
// around the tooltip, clear of the broadcast's logos. Look at the result before committing it.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { MARQUEE, marquee } from "./store-templates.mjs";

const { values } = parseArgs({ options: { chrome: { type: "string" }, frame: { type: "string" }, tooltip: { type: "string" }, out: { type: "string", default: "docs/banner.webp" } } });
if (!values.chrome || !values.frame || !values.tooltip) {
  console.error('usage: node scripts/banner.mjs --chrome "<Chrome for Testing>" --frame <frame.png> --tooltip x,y,width,height [--out docs/banner.webp]');
  process.exit(2);
}
const [x, y, width, height] = values.tooltip.split(",").map(Number);
const png = readFileSync(values.frame);
// A PNG's size is in its IHDR chunk.
const imageSize = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
const dataUrl = (bytes) => `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
const root = new URL("..", import.meta.url).pathname;
const html = marquee({ icon: dataUrl(readFileSync(join(root, "icons", "icon-128.png"))), image: dataUrl(png), imageSize, tooltip: { x, y, width, height } });

const { default: puppeteer } = await import("puppeteer-core");
const browser = await puppeteer.launch({ executablePath: values.chrome, headless: true, defaultViewport: { ...MARQUEE, deviceScaleFactor: 1 } });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 300));
  writeFileSync(values.out, await page.screenshot({ type: "webp", quality: 90 }));
} finally {
  await browser.close();
}
console.log(`wrote ${values.out} (${MARQUEE.width}×${MARQUEE.height})`);
