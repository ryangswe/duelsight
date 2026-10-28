// SPDX-License-Identifier: Apache-2.0
// Captures every shot the reel uses from the real DuelSight extension, locally: no video site.
// Each shot is one training frame (official broadcast or creator footage, never a held-out or
// development frame) played as a still clip on the extension's own manual test page, with the
// 0.2.0 dev build (release T2) loaded in Chrome for Testing. The recognition, the button and the
// tooltip are the extension's own; the pointer is drawn later from mouse.jsonl.
//
//   node scripts/capture.mjs --chrome <CfT binary> [--only id,id]
//
// Writes captures/<id>/frames/<n>.jpg (CDP screencast), frames.jsonl, mouse.jsonl and log.json
// (each hover: the card aimed at, the name the tooltip showed, when it appeared).

import { mkdirSync, writeFileSync, appendFileSync, rmSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { parseArgs } from "node:util";
import puppeteer from "puppeteer-core";
import { startServer } from "../../../test/manual/serve.mjs";

const { values } = parseArgs({ options: { chrome: { type: "string" }, only: { type: "string" } } });
const ROOT = resolve(new URL("..", import.meta.url).pathname);
const CAP = join(ROOT, "captures");
const EXT = join(CAP, "ext");
const SHOTS = JSON.parse(readFileSync(join(ROOT, "scripts", "shots-capture.json"), "utf8"));
const W = 1920;
const H = 1080;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function captureShot(shot) {
  const dir = join(CAP, shot.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "frames"), { recursive: true });
  const server = await startServer({ video: join(CAP, "clips", `${shot.frame}.webm`), port: 0 });
  const profile = join(tmpdir(), `ds-reel-${shot.id}-${process.pid}`);
  const browser = await puppeteer.launch({
    executablePath: values.chrome, headless: true, pipe: true, userDataDir: profile, enableExtensions: [EXT],
    args: ["--autoplay-policy=no-user-gesture-required", `--window-size=${W},${H}`],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  const log = { shot: shot.id, frame: shot.frame, button: !!shot.button, hovers: [] };
  try {
    const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 20_000 });
    const origin = sw.url().split("/").slice(0, 3).join("/");
    const setup = await browser.newPage();
    await setup.goto(`${origin}/popup.html`);
    // Card details on; hovers already on for this page unless the shot clicks the button itself.
    await setup.evaluate((on) => chrome.storage.local.set(on ? { "channel:local:/": Date.now() } : {}), !shot.button);
    await setup.close();

    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    // The video fills the viewport at the frame's own size; no page text, no native controls.
    await page.addStyleTag({ content: "body{margin:0;padding:0;background:#000;overflow:hidden} p{display:none} video{width:1920px!important;height:1080px!important;max-width:none}" });
    await page.evaluate(() => { const v = document.querySelector("video"); v.removeAttribute("controls"); });
    await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2, { timeout: 30_000 });
    await page.evaluate(async () => { const v = document.querySelector("video"); v.pause(); v.currentTime = 1; await new Promise((r) => v.addEventListener("seeked", r, { once: true })); });
    let mouse = { x: shot.start?.[0] ?? W * 0.62, y: shot.start?.[1] ?? H * 0.72 };
    const logMouse = (kind = "move") => appendFileSync(join(dir, "mouse.jsonl"), JSON.stringify({ t: Date.now() / 1000, x: mouse.x, y: mouse.y, kind }) + "\n");
    const moveTo = async (x, y, ms) => {
      const x0 = mouse.x, y0 = mouse.y, steps = Math.max(1, Math.round(ms / 16)), t0 = Date.now();
      for (let i = 1; i <= steps; i++) {
        const k = ease(i / steps);
        mouse = { x: x0 + (x - x0) * k, y: y0 + (y - y0) * k };
        await page.mouse.move(mouse.x, mouse.y);
        logMouse();
        const wait = t0 + (i * ms) / steps - Date.now();
        if (wait > 0) await sleep(wait);
      }
    };
    const tooltip = async () => {
      const vis = await page.evaluate(() => [...document.querySelectorAll('iframe[title="Card"]')].some((f) => f.style.visibility === "visible"));
      if (!vis) return null;
      const f = page.frames().find((x) => x.url().startsWith("chrome-extension://") && x.url().endsWith("/tooltip.html"));
      if (!f) return null;
      return f.evaluate(() => {
        const img = document.getElementById("img"), art = document.getElementById("art"), pill = document.getElementById("pill");
        return { name: art.hidden ? pill.textContent : img.alt, picture: !art.hidden && img.naturalWidth > 0 && !art.classList.contains("loading") };
      }).catch(() => null);
    };
    const waitTooltip = async (ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await tooltip(); if (s) return s; await page.mouse.move(mouse.x + 0.5, mouse.y); await sleep(100); } return null; };

    await page.mouse.move(mouse.x, mouse.y);
    // Warm-up (not recorded): the model loads and this frame is analyzed once, so the recorded hovers
    // show the tooltip as the pointer arrives, as on a recent computer.
    if (!shot.button) {
      for (const c of shot.cards) { await page.mouse.move(c.at[0], c.at[1]); await waitTooltip(90_000); }
      await page.mouse.move(mouse.x, mouse.y); await sleep(1200);
    }

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
    logMouse("start");
    await sleep(1500);
    if (shot.button) {
      const b = await page.evaluate(() => { const r = document.querySelector('[data-duelsight="button"]')?.getBoundingClientRect(); return r && r.width ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null; });
      if (!b) throw new Error(`${shot.id}: the DuelSight button is not shown`);
      await moveTo(b.x, b.y, 1100); await sleep(350);
      logMouse("down"); await page.mouse.click(b.x, b.y);
      log.click = { t: Date.now() / 1000, at: [b.x, b.y] };
      await sleep(500);
      if (shot.after) { await moveTo(shot.after[0], shot.after[1], 500); await sleep(600); }
    }
    for (const c of shot.cards) {
      await moveTo(c.at[0], c.at[1], c.travel ?? 700);
      const arrived = Date.now() / 1000;
      const s = await waitTooltip(90_000);
      const shown = Date.now() / 1000;
      await sleep(2600); // the picture and the details arrive from the CDN
      const settled = (await tooltip()) ?? s;
      log.hovers.push({ expect: c.name, at: c.at, arrived, shown: s ? shown : null, name: settled?.name ?? null, picture: !!settled?.picture, ok: settled?.name === c.name });
      console.log(`${shot.id}: ${c.name} -> ${settled?.name ?? "nothing"} (${s ? (shown - arrived).toFixed(1) + " s" : "no tooltip"})`);
      if (c.away) { await moveTo(c.away[0], c.away[1], 500); await sleep(500); }
    }
    await sleep(800);
    await cdp.send("Page.stopScreencast");
    await sleep(300);
  } finally {
    writeFileSync(join(dir, "log.json"), JSON.stringify(log, null, 1) + "\n");
    await browser.close();
    server.close();
    rmSync(profile, { recursive: true, force: true });
  }
  return log;
}

const only = values.only ? new Set(values.only.split(",")) : null;
for (const shot of SHOTS) {
  if (only && !only.has(shot.id)) continue;
  await captureShot(shot);
}
