// SPDX-License-Identifier: Apache-2.0
// The Chrome Web Store images, from the real extension: four 1280×800 screenshots, the 440×280 small
// promo tile and the 1400×560 marquee. A dev build is loaded in Chrome for Testing and hovers cards
// on two clips of your own (one Master Duel, one paper table) on a bare local page; the captures are
// then laid out by scripts/store-templates.mjs (which holds the copy and the order).
//
//   npm run build -- --dev --release <release folder>
//   npm install --no-save puppeteer-core
//   node scripts/store-assets.mjs --chrome "<Chrome for Testing binary>" --clips clips.json --out <folder outside the repository>
//
// clips.json names the two clips and a card in each (its centre, in the clip's own pixels;
// `cardvision infer` boxes give it):
//   { "master-duel": { "video": "/clips/md.webm", "card": [793, 351] },
//     "paper": { "video": "/clips/paper.webm", "card": [576, 493] } }
// Make each clip from one frame of an official broadcast, cropped to the game (no faces, no other
// people's overlays), as docs/store-listing.md shows. The images hold card art and broadcast frames:
// write them outside the repository, check each one, then replace the files in docs/store/ (the
// listing's images, not covered by the repository's license). `puppeteer-core` is not a
// dependency of this repository; install it yourself as above. Branded Chrome does not load unpacked
// extensions from the command line: use Chrome for Testing. It never opens a video site.

import { createReadStream, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { insideRepository } from "./card-details.mjs";
import { MARQUEE, marquee, SCREENSHOTS, SHOT, sideShot, SMALL_TILE, smallTile } from "./store-templates.mjs";

const TYPES = { ".webm": "video/webm", ".mp4": "video/mp4", ".m4v": "video/mp4", ".ogv": "video/ogg" };
export const CLIPS = ["master-duel", "paper"];

/** The size a clip of w×h is shown at: as large as fits in 1280×800, its own shape. */
export function placeVideo(w, h, box = SHOT) {
  const scale = Math.min(box.width / w, box.height / h);
  return { width: Math.round(w * scale), height: Math.round(h * scale), scale };
}

/** The clips file's problems, or an empty list. */
export function clipsProblems(clips) {
  if (!clips || typeof clips !== "object" || Array.isArray(clips)) return ["clips: an object with master-duel and paper"];
  const out = [];
  for (const name of CLIPS) {
    const c = clips[name];
    if (!c) { out.push(`${name}: missing`); continue; }
    if (typeof c.video !== "string" || !TYPES[extname(c.video).toLowerCase()]) out.push(`${name}.video: a .webm, .mp4 or .ogv clip`);
    if (!Array.isArray(c.card) || c.card.length !== 2 || !c.card.every((v) => Number.isFinite(v) && v >= 0)) out.push(`${name}.card: [x, y] in the clip's pixels`);
  }
  for (const name of Object.keys(clips)) if (!CLIPS.includes(name)) out.push(`${name}: not a clip this script uses (${CLIPS.join(", ")})`);
  return out;
}

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>DuelSight</title><style>
html,body{margin:0;background:#000;overflow:hidden}video{position:absolute;left:0;top:0;width:100vw;height:100vh;background:#000}
</style></head><body><video id="video" src="/video" muted loop playsinline autoplay></video></body></html>`;

/** A local page with the clip filling the window (it also serves the clip, with ranges). */
function serve(video) {
  const size = statSync(video).size;
  const type = TYPES[extname(video).toLowerCase()];
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    if (path === "/") return res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(PAGE);
    if (path !== "/video") return res.writeHead(404).end();
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (!m) {
      res.writeHead(200, { "content-type": type, "content-length": size, "accept-ranges": "bytes" });
      return createReadStream(video).pipe(res);
    }
    const start = m[1] ? Number(m[1]) : size - Number(m[2]);
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1, "accept-ranges": "bytes" });
    createReadStream(video, { start, end }).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dataUrl = (png) => `data:image/png;base64,${Buffer.from(png).toString("base64")}`;

/** A browser with the extension, a fresh profile and the given stored settings; `fn` gets it and its origin. */
async function withBrowser(ctx, viewport, stored, fn) {
  const profile = mkdtempSync(join(tmpdir(), "store-assets-"));
  const browser = await ctx.puppeteer.launch({
    executablePath: ctx.chrome, headless: true, pipe: true, userDataDir: profile, enableExtensions: [ctx.dist],
    args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"],
    defaultViewport: { ...viewport, deviceScaleFactor: 1 },
  });
  try {
    const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 15_000 });
    const origin = sw.url().split("/").slice(0, 3).join("/");
    if (Object.keys(stored).length > 0) {
      const setup = await browser.newPage();
      await setup.goto(`${origin}/popup.html`);
      await setup.evaluate((items) => chrome.storage.local.set(items), stored);
      await setup.close();
    }
    return await fn(browser, origin);
  } finally {
    await browser.close();
    rmSync(profile, { recursive: true, force: true });
  }
}

async function videoSize(ctx, video) {
  return withBrowser(ctx, { width: 320, height: 180 }, {}, async (browser) => {
    const server = await serve(video);
    try {
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.waitForFunction(() => document.querySelector("video")?.readyState >= 1, { timeout: 30_000 });
      return page.evaluate(() => ({ w: document.querySelector("video").videoWidth, h: document.querySelector("video").videoHeight }));
    } finally {
      server.close();
    }
  });
}

const tooltipRect = (page) => page.evaluate(() => {
  const f = [...document.querySelectorAll('iframe[title="Card"]')].find((x) => x.style.visibility === "visible");
  if (!f) return null;
  const r = f.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
/** Rest the pointer on the card until a tooltip shows; then let its picture and details arrive. */
async function hoverCard(page, clip, place, name) {
  const x = clip.card[0] * place.scale;
  const y = clip.card[1] * place.scale;
  for (let i = 0; i < 80; i++) {
    await page.mouse.move(x + (i % 2), y);
    await sleep(250);
    if (await tooltipRect(page)) {
      await sleep(4000); // the picture and the details file come from the CDN
      return tooltipRect(page);
    }
  }
  throw new Error(`${name}: no card shown at (${clip.card}) within 20 s; check the point and the clip`);
}

async function openClip(browser, video) {
  const server = await serve(video);
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2, { timeout: 30_000 });
  await page.evaluate(() => document.querySelector("video").play());
  await sleep(2000);
  return { page, server };
}

/** A hover capture: the clip at its shape, card details on or off. */
async function captureHover(ctx, clip, place, details, name) {
  return withBrowser(ctx, { width: place.width, height: place.height }, { details }, async (browser) => {
    const { page, server } = await openClip(browser, clip.video);
    try {
      const tooltip = await hoverCard(page, clip, place, name);
      return { png: await page.screenshot({ type: "png" }), size: { width: place.width, height: place.height }, tooltip };
    } finally {
      server.close();
    }
  });
}

async function capturePopup(ctx) {
  return withBrowser(ctx, { width: 280, height: 720 }, {}, async (browser, origin) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 280, height: 720, deviceScaleFactor: 2 });
    await page.goto(`${origin}/popup.html`);
    await sleep(1200);
    const h = await page.evaluate(() => Math.ceil(Math.max(...[...document.body.querySelectorAll("*")].map((e) => e.getBoundingClientRect().bottom))) + 14);
    const height = Math.min(h, 720);
    return { png: await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 280, height } }), size: { width: 560, height: height * 2 } };
  });
}

/** Render a layout page and save it as JPEG (the store takes JPEG, or PNG without alpha). */
async function render(ctx, html, size, file) {
  await withBrowser(ctx, size, {}, async (browser) => {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await sleep(300);
    writeFileSync(file, await page.screenshot({ type: "jpeg", quality: 92 }));
  });
  console.log(`wrote ${file}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const { values } = parseArgs({
    options: { chrome: { type: "string" }, clips: { type: "string" }, out: { type: "string" }, dist: { type: "string", default: join(root, "dist") } },
  });
  if (!values.chrome || !values.clips || !values.out) {
    console.error("usage: node scripts/store-assets.mjs --chrome <Chrome for Testing> --clips clips.json --out <folder outside the repository>");
    process.exit(2);
  }
  if (insideRepository(values.out, root)) {
    console.error("--out is inside the repository: the images hold card art and video frames; write them outside it");
    process.exit(2);
  }
  const manifest = JSON.parse(readFileSync(join(values.dist, "manifest.json"), "utf-8"));
  if (!JSON.stringify(manifest).includes("127.0.0.1")) {
    console.error(`${values.dist} is not a dev build (it does not run on the local page): npm run build -- --dev --release <folder>`);
    process.exit(2);
  }
  const clips = JSON.parse(readFileSync(values.clips, "utf-8"));
  const problems = clipsProblems(clips);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(2);
  }
  for (const name of CLIPS) clips[name].video = resolve(clips[name].video);
  const { default: puppeteer } = await import("puppeteer-core");
  const ctx = { puppeteer, chrome: values.chrome, dist: resolve(values.dist) };
  const out = resolve(values.out);
  mkdirSync(out, { recursive: true });

  const place = {};
  for (const name of CLIPS) {
    const { w, h } = await videoSize(ctx, clips[name].video);
    place[name] = placeVideo(w, h);
  }
  const md = clips["master-duel"];
  const paper = clips.paper;
  const captures = {
    "md-hover": await captureHover(ctx, md, place["master-duel"], true, "md-hover"),
    "paper-hover": await captureHover(ctx, paper, place.paper, true, "paper-hover"),
    "paper-card-only": await captureHover(ctx, paper, place.paper, false, "paper-card-only"),
    popup: await capturePopup(ctx),
  };
  const icon = dataUrl(readFileSync(join(root, "icons", "icon-128.png")));
  for (const s of SCREENSHOTS) {
    const c = captures[s.capture];
    const html = sideShot({ icon, title: s.title, lead: s.lead, image: dataUrl(c.png), imageSize: c.size, ...(s.layout === "popup" ? { maxW: 460, maxH: 660 } : {}) });
    await render(ctx, html, SHOT, join(out, `${s.name}-1280x800.jpg`));
  }
  const card = captures["paper-card-only"];
  await render(ctx, smallTile({ icon, image: dataUrl(card.png), imageSize: card.size, tooltip: card.tooltip }), SMALL_TILE, join(out, "promo-small-440x280.jpg"));
  const hover = captures["md-hover"];
  await render(ctx, marquee({ icon, image: dataUrl(hover.png), imageSize: hover.size, tooltip: hover.tooltip }), MARQUEE, join(out, "promo-marquee-1400x560.jpg"));
}
