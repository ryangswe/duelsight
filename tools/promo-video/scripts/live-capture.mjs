// SPDX-License-Identifier: Apache-2.0
// Live captures on YouTube, run by hand in a short window agreed beforehand, gently:
// each shot opens its own watch page by a timestamped URL (&t=), never seeks, plays at most
// MAX_PLAY seconds, one page at a time, at least GAP seconds between loads, the page closed between
// videos, and a stop for good at the first block sign (written to captures/live/BLOCK.json).
// A fresh profile (no sign-in, nothing carried over), the 0.2.0 dev build of release T2 in captures/ext/,
// and the Chrome for Testing binary named in captures/chrome-path.txt. The posted reel was made with
// this script as it is; from 0.4.0 the extension has no in-player button, so drop the click below.
//
//   node scripts/live-capture.mjs [--only id,id] [--dry]
//
// Writes captures/live-<id>/frames/*.jpg, frames.jsonl, mouse.jsonl, log.json (as capture.mjs), and
// appends every load to captures/live/loads.jsonl.

import { mkdirSync, writeFileSync, appendFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import puppeteer from "puppeteer-core";

const { values } = parseArgs({ options: { only: { type: "string" }, dry: { type: "boolean", default: false } } });
const ROOT = resolve(new URL("..", import.meta.url).pathname);
const CAP = join(ROOT, "captures");
const LIVE = join(CAP, "live");
mkdirSync(LIVE, { recursive: true });
if (existsSync(join(LIVE, "BLOCK.json"))) throw new Error("a block sign was seen earlier (captures/live/BLOCK.json): no more loads");
const CHROME = readFileSync(join(CAP, "chrome-path.txt"), "utf8").trim();
const EXT = join(CAP, "ext");
const SHOTS = JSON.parse(readFileSync(join(ROOT, "scripts", "shots-live.json"), "utf8"));
const W = 1920, H = 1080, MAX_PLAY = 28, GAP = 6;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const BLOCK_TEXT = [/something went wrong/i, /not a bot/i, /unusual traffic/i, /sign in to confirm/i, /our systems have detected/i, /this video is unavailable/i];

if (values.dry) { console.log(SHOTS.map((s) => `${s.id}: ${s.video} t=${s.t} cards ${s.cards.map((c) => c.name).join(" | ")}`).join("\n")); process.exit(0); }
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: false, pipe: true, userDataDir: join(LIVE, "profile"), enableExtensions: [EXT],
  args: [`--window-size=${W},${H + 120}`, "--autoplay-policy=no-user-gesture-required", "--no-first-run", "--no-default-browser-check"],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
let lastLoad = 0;
const block = (why, shot) => { writeFileSync(join(LIVE, "BLOCK.json"), JSON.stringify({ at: new Date().toISOString(), shot, why }, null, 1)); throw new Error(`BLOCK SIGN (${why}): stopping for good`); };

async function shotRun(shot) {
  const wait = lastLoad + GAP * 1000 - Date.now();
  if (wait > 0) await sleep(wait);
  const dir = join(CAP, `live-${shot.id}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "frames"), { recursive: true });
  const url = `https://www.youtube.com/watch?v=${shot.video}&t=${shot.t}s`;
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const log = { shot: shot.id, url, hovers: [], loadAt: new Date().toISOString() };
  let status = null;
  page.on("response", (r) => { if (r.url().startsWith("https://www.youtube.com/watch")) status = r.status(); });
  lastLoad = Date.now();
  let mouse = { x: W * 0.6, y: H * 0.7 };
  const logMouse = (kind = "move") => appendFileSync(join(dir, "mouse.jsonl"), JSON.stringify({ t: Date.now() / 1000, x: mouse.x, y: mouse.y, kind }) + "\n");
  const moveTo = async (x, y, ms) => {
    const x0 = mouse.x, y0 = mouse.y, steps = Math.max(1, Math.round(ms / 16)), t0 = Date.now();
    for (let i = 1; i <= steps; i++) {
      const k = ease(i / steps); mouse = { x: x0 + (x - x0) * k, y: y0 + (y - y0) * k };
      await page.mouse.move(mouse.x, mouse.y); logMouse();
      const w = t0 + (i * ms) / steps - Date.now(); if (w > 0) await sleep(w);
    }
  };
  const playStarted = { t: null };
  const played = () => (playStarted.t ? (Date.now() - playStarted.t) / 1000 : 0);
  const checkBlock = async () => {
    if (status === 429) block("HTTP 429 on the watch page", shot.id);
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 4000) ?? "").catch(() => "");
    for (const re of BLOCK_TEXT) if (re.test(text)) block(`page text ${re}`, shot.id);
    if (/accounts\.google\.com|\/sorry\//.test(page.url())) block(`redirected to ${page.url()}`, shot.id);
  };
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await sleep(1500);
    await checkBlock();
    // A consent page: decline non-essential cookies (the most private choice).
    const reject = await page.$('button[aria-label*="Reject" i]');
    if (reject) { await reject.click(); await sleep(2500); log.consent = "rejected non-essential"; }
    await page.waitForFunction(() => document.querySelector("#movie_player video")?.readyState >= 2, { timeout: 30_000 });
    playStarted.t = Date.now();
    // Ads: skip when the player offers it; give up on this load if an ad would use the playback budget.
    for (let i = 0; i < 60 && (await page.evaluate(() => !!document.querySelector("#movie_player.ad-showing"))); i++) {
      const skip = await page.$(".ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button");
      if (skip) await skip.click().catch(() => {});
      if (played() > 12) { log.aborted = "ad longer than the budget"; return log; }
      await sleep(500);
    }
    await checkBlock();
    // The player fills the viewport; YouTube's own controls, title, channel watermark and overlays hidden
    // (the DuelSight button and tooltip are the extension's, outside these).
    await page.addStyleTag({ content: `
      html,body{overflow:hidden!important;background:#000!important}
      #secondary,#below,#chat,#chat-container,ytd-live-chat-frame,#related,#comments,ytd-comments,#panels,
      ytd-engagement-panel-section-list-renderer,ytd-watch-metadata,#masthead-container,ytd-masthead,tp-yt-app-drawer,
      #guide,ytd-mini-guide-renderer,ytd-popup-container,tp-yt-iron-overlay-backdrop,#offer-module,ytd-merch-shelf-renderer{display:none!important}
      #movie_player{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:2147483000!important;background:#000}
      .ytp-chrome-bottom,.ytp-chrome-top,.ytp-gradient-top,.ytp-gradient-bottom,.ytp-watermark,.ytp-ce-element,.ytp-paid-content-overlay,.ytp-pause-overlay,.ytp-cards-teaser,.ytp-chapter-container,.ytp-tooltip,.iv-branding,.ytp-spinner,.ytp-suggested-action,.ytp-featured-product{display:none!important}` });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await sleep(800);
    const vr = await page.evaluate(() => { const r = document.querySelector("#movie_player video").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const ct = await page.evaluate(() => document.querySelector("#movie_player video").currentTime);
    log.currentTime = ct;
    if (Math.abs(ct - shot.t) > 8) { log.aborted = `playing at ${ct.toFixed(1)} s, not near t=${shot.t}`; return log; }
    log.video = vr;
    const at = (p) => [vr.x + (p[0] * vr.w) / 1920, vr.y + (p[1] * vr.h) / 1080];
    const strays = await page.evaluate(() => {
      const out = [];
      for (let i = 1; i < 12; i++) for (let j = 1; j < 7; j++) {
        const x = (i * innerWidth) / 12, y = (j * innerHeight) / 7;
        const el = document.elementFromPoint(x, y);
        if (!el) continue;
        if (el.closest("#movie_player") || el.closest("[data-duelsight]") || el.tagName === "IFRAME" && el.src.startsWith("chrome-extension://")) continue;
        out.push(`${Math.round(x)},${Math.round(y)} ${el.tagName.toLowerCase()}#${el.id}.${String(el.className).slice(0, 40)}`);
      }
      return out;
    });
    if (strays.length) { log.aborted = `page elements over the video: ${strays.slice(0, 4).join(" | ")}`; return log; }
    // Record.
    const cdp = await page.createCDPSession();
    let n = 0;
    cdp.on("Page.screencastFrame", async (f) => {
      const k = n++;
      writeFileSync(join(dir, "frames", `${String(k).padStart(6, "0")}.jpg`), Buffer.from(f.data, "base64"));
      appendFileSync(join(dir, "frames.jsonl"), JSON.stringify({ n: k, t: f.metadata.timestamp }) + "\n");
      await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    mouse = { x: at(shot.start)[0], y: at(shot.start)[1] };
    await page.mouse.move(mouse.x, mouse.y); logMouse("start");
    await sleep(1200);
    // Turn card hovers on for this channel with the in-player button (a real click).
    let btn = null;
    for (let i = 0; i < 32 && !btn; i++) { btn = await page.evaluate(() => { const r = document.querySelector('[data-duelsight="button"]')?.getBoundingClientRect(); return r && r.width ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null; }); if (!btn) { await page.mouse.move(W / 2 + (i % 2), H / 2); await sleep(250); } }
    if (!btn) { log.aborted = "the DuelSight button did not show"; return log; }
    await moveTo(btn.x, btn.y, 1100); await sleep(350);
    logMouse("down"); await page.mouse.click(btn.x, btn.y);
    log.click = { t: Date.now() / 1000, at: [btn.x, btn.y] };
    await sleep(700);
    const tooltip = async () => {
      const vis = await page.evaluate(() => [...document.querySelectorAll('iframe[title="Card"]')].some((f) => f.style.visibility === "visible"));
      if (!vis) return null;
      const f = page.frames().find((x) => x.url().startsWith("chrome-extension://") && x.url().endsWith("/tooltip.html"));
      return f ? f.evaluate(() => { const img = document.getElementById("img"), art = document.getElementById("art"), pill = document.getElementById("pill"); return { name: art.hidden ? pill.textContent : img.alt, picture: !art.hidden && img.naturalWidth > 0 && !art.classList.contains("loading") }; }).catch(() => null) : null;
    };
    for (const c of shot.cards) {
      if (played() > MAX_PLAY - 4) break;
      const [x, y] = at(c.at);
      await moveTo(x, y, c.travel ?? 750);
      const arrived = Date.now() / 1000;
      let s = null;
      while (!s && played() < MAX_PLAY - 2.5) { s = await tooltip(); if (!s) { await page.mouse.move(mouse.x + 0.5, mouse.y); await sleep(100); } }
      const shown = s ? Date.now() / 1000 : null;
      await sleep(1900);
      const settled = (await tooltip()) ?? s;
      log.hovers.push({ expect: c.name, at: [x, y], arrived, shown, name: settled?.name ?? null, picture: !!settled?.picture, ok: settled?.name === c.name });
      console.log(`${shot.id}: ${c.name} -> ${settled?.name ?? "nothing"} (${s ? (shown - arrived).toFixed(1) + " s" : "no tooltip"}); played ${played().toFixed(1)} s`);
      if (c.away) await moveTo(...at(c.away), 500);
    }
    await cdp.send("Page.stopScreencast").catch(() => {});
    await checkBlock();
  } finally {
    await page.evaluate(() => document.querySelector("#movie_player video")?.pause()).catch(() => {});
    log.played = played();
    writeFileSync(join(dir, "log.json"), JSON.stringify(log, null, 1) + "\n");
    appendFileSync(join(LIVE, "loads.jsonl"), JSON.stringify({ shot: shot.id, url, at: log.loadAt, played: log.played, aborted: log.aborted ?? null, status }) + "\n");
    await page.close().catch(() => {});
  }
  return log;
}

try {
  for (const shot of SHOTS) {
    if (values.only && !values.only.split(",").includes(shot.id)) continue;
    const l = await shotRun(shot);
    console.log(`${shot.id}: played ${l.played?.toFixed(1)} s${l.aborted ? ", ABORTED: " + l.aborted : ""}`);
  }
} finally {
  await browser.close();
}
