// SPDX-License-Identifier: Apache-2.0
// The Chrome Web Store screenshots (1280×800), taken from the real extension: a dev build hovering a
// card on a clip of your own, on a bare local page, and optionally the toolbar popup beside it.
//
//   npm run build -- --dev --release <release folder>
//   npm install --no-save puppeteer-core
//   node scripts/store-screenshots.mjs --chrome "<Chrome for Testing binary>" --shots shots.json --out <folder outside the repository>
//
// shots.json lists the screenshots, in listing order:
//   [{ "name": "1-master-duel", "video": "/path/md.webm", "hover": [793, 351] },
//    { "name": "3-popup", "video": "/path/paper.webm", "hover": [576, 493], "popup": true }]
// `hover` is the card's centre in the clip's own pixels (`cardvision infer` boxes give it). The clip
// is shown whole, centred on the 1280×800 page. Make each clip from one frame, cropped to the game
// (no faces, no other people's overlays), as docs/store-listing.md shows. The screenshots hold card
// art and frames of others' videos: they are written outside the repository and never committed.
// `puppeteer-core` is not a dependency of this repository; install it yourself as above. Branded
// Chrome does not load unpacked extensions from the command line: use Chrome for Testing. It never
// opens a video site.

import { createReadStream, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { insideRepository } from "./card-details.mjs";

export const SIZE = { width: 1280, height: 800 };
const TYPES = { ".webm": "video/webm", ".mp4": "video/mp4", ".m4v": "video/mp4", ".ogv": "video/ogg" };

/** Where a clip of w×h sits on the page: as large as fits, centred. */
export function placeVideo(w, h, page = SIZE) {
  const scale = Math.min(page.width / w, page.height / h);
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  return { left: Math.round((page.width - width) / 2), top: Math.round((page.height - height) / 2), width, height, scale };
}

/** The page point over a clip pixel. */
export function pagePoint(place, x, y) {
  return { x: place.left + x * place.scale, y: place.top + y * place.scale };
}

/** The shots file's problems, or an empty list. */
export function shotsProblems(shots) {
  if (!Array.isArray(shots) || shots.length === 0) return ["shots: a non-empty list"];
  const out = [];
  const names = new Set();
  shots.forEach((s, i) => {
    const at = `shots[${i}]`;
    if (typeof s?.name !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(s.name)) out.push(`${at}.name: letters, digits, - and _`);
    else if (names.has(s.name)) out.push(`${at}.name: ${s.name} twice`);
    else names.add(s.name);
    if (typeof s?.video !== "string" || !TYPES[extname(s.video).toLowerCase()]) out.push(`${at}.video: a .webm, .mp4 or .ogv clip`);
    if (!Array.isArray(s?.hover) || s.hover.length !== 2 || !s.hover.every((v) => Number.isFinite(v) && v >= 0)) out.push(`${at}.hover: [x, y] in the clip's pixels`);
    if (s?.popup !== undefined && typeof s.popup !== "boolean") out.push(`${at}.popup: true or false`);
  });
  return out;
}

const PAGE = (p) => `<!doctype html><html><head><meta charset="utf-8"><title>DuelSight</title><style>
html,body{margin:0;background:#0d0c12;overflow:hidden}video{position:absolute;left:${p.left}px;top:${p.top}px;width:${p.width}px;height:${p.height}px;background:#000}
</style></head><body><video id="video" src="/video" muted loop playsinline autoplay></video></body></html>`;

/** A local page with the clip placed by `place` (it also serves the clip, with ranges). */
function serve(video, place) {
  const size = statSync(video).size;
  const type = TYPES[extname(video).toLowerCase()];
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    if (path === "/") return res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(PAGE(place));
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

async function shoot(puppeteer, chrome, dist, shot, out) {
  const profile = mkdtempSync(join(tmpdir(), "store-shot-"));
  const browser = await puppeteer.launch({
    executablePath: chrome, headless: true, pipe: true, userDataDir: profile, enableExtensions: [dist],
    args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"],
    defaultViewport: { ...SIZE, deviceScaleFactor: 1 },
  });
  let server;
  try {
    const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 15_000 });
    const origin = sw.url().split("/").slice(0, 3).join("/");
    const setup = await browser.newPage();
    await setup.goto(`${origin}/popup.html`);
    await setup.evaluate(() => chrome.storage.local.set({ "channel:local:/": Date.now() }));
    await setup.close();

    const probe = await browser.newPage();
    const tmpServer = await serve(shot.video, { left: 0, top: 0, width: 16, height: 9 });
    await probe.goto(`http://127.0.0.1:${tmpServer.address().port}/`);
    await probe.waitForFunction(() => document.querySelector("video")?.readyState >= 1, { timeout: 30_000 });
    const dims = await probe.evaluate(() => ({ w: document.querySelector("video").videoWidth, h: document.querySelector("video").videoHeight }));
    await probe.close();
    tmpServer.close();

    const place = placeVideo(dims.w, dims.h);
    server = await serve(shot.video, place);
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2, { timeout: 30_000 });
    await page.evaluate(() => document.querySelector("video").play());
    await sleep(2000);
    const at = pagePoint(place, shot.hover[0], shot.hover[1]);
    let shown = false;
    for (let i = 0; i < 80 && !shown; i++) {
      await page.mouse.move(at.x + (i % 2), at.y);
      await sleep(250);
      shown = await page.evaluate(() => [...document.querySelectorAll('iframe[title="Card"]')].some((f) => f.style.visibility === "visible"));
    }
    if (!shown) throw new Error(`${shot.name}: no card shown at (${shot.hover}) within 20 s; check the point and the clip`);
    await sleep(4000); // the card's picture and details arrive from the CDN
    let png = await page.screenshot({ type: "png" });

    if (shot.popup) {
      const pop = await browser.newPage();
      await pop.setViewport({ width: 280, height: 720, deviceScaleFactor: 2 });
      await pop.goto(`${origin}/popup.html`);
      await sleep(1000);
      const h = await pop.evaluate(() => Math.ceil(Math.max(...[...document.body.querySelectorAll("*")].map((e) => e.getBoundingClientRect().bottom))) + 12);
      const popPng = await pop.screenshot({ type: "png", clip: { x: 0, y: 0, width: 280, height: Math.min(h, 720) } });
      await pop.close();
      const compose = await browser.newPage();
      await compose.setContent(`<!doctype html><html><body style="margin:0;width:${SIZE.width}px;height:${SIZE.height}px;position:relative;background:#000">
<img src="data:image/png;base64,${Buffer.from(png).toString("base64")}" style="position:absolute;left:0;top:0;width:${SIZE.width}px;height:${SIZE.height}px">
<img src="data:image/png;base64,${Buffer.from(popPng).toString("base64")}" style="position:absolute;right:24px;top:16px;width:280px;border-radius:12px;border:1px solid #46425a;box-shadow:0 12px 32px rgba(0,0,0,.6)">
</body></html>`);
      await sleep(300);
      png = await compose.screenshot({ type: "png" });
    }
    // JPEG: the store takes JPEG or 24-bit PNG (no alpha); a JPEG has no alpha to strip.
    const shotPage = await browser.newPage();
    await shotPage.setContent(`<!doctype html><body style="margin:0"><img src="data:image/png;base64,${Buffer.from(png).toString("base64")}"></body>`);
    await sleep(200);
    const jpg = await shotPage.screenshot({ type: "jpeg", quality: 92 });
    const file = join(out, `${shot.name}.jpg`);
    writeFileSync(file, jpg);
    return file;
  } finally {
    server?.close();
    await browser.close();
    rmSync(profile, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const { values } = parseArgs({
    options: {
      chrome: { type: "string" },
      shots: { type: "string" },
      out: { type: "string" },
      dist: { type: "string", default: join(root, "dist") },
    },
  });
  if (!values.chrome || !values.shots || !values.out) {
    console.error("usage: node scripts/store-screenshots.mjs --chrome <Chrome for Testing> --shots shots.json --out <folder outside the repository>");
    process.exit(2);
  }
  if (insideRepository(values.out, root)) {
    console.error("--out is inside the repository: the screenshots hold card art and video frames; write them outside it");
    process.exit(2);
  }
  const manifest = JSON.parse(readFileSync(join(values.dist, "manifest.json"), "utf-8"));
  if (!JSON.stringify(manifest).includes("127.0.0.1")) {
    console.error(`${values.dist} is not a dev build (it does not run on the local page): npm run build -- --dev --release <folder>`);
    process.exit(2);
  }
  const shots = JSON.parse(readFileSync(values.shots, "utf-8"));
  const problems = shotsProblems(shots);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(2);
  }
  const { default: puppeteer } = await import("puppeteer-core");
  mkdirSync(values.out, { recursive: true });
  for (const shot of shots) {
    const file = await shoot(puppeteer, values.chrome, resolve(values.dist), { ...shot, video: resolve(shot.video) }, resolve(values.out));
    console.log(`wrote ${file}`);
  }
}
