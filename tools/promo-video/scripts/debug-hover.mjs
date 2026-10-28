// SPDX-License-Identifier: Apache-2.0
// Debug one hover: what the extension's compute frame reports while the pointer rests on a card.
//   node scripts/debug-hover.mjs --chrome <CfT> --frame <clip name> --x 822 --y 499 [--width 1920]
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { parseArgs } from "node:util";
import puppeteer from "puppeteer-core";
import { startServer } from "../../../test/manual/serve.mjs";

const { values } = parseArgs({ options: { chrome: { type: "string" }, frame: { type: "string" }, x: { type: "string" }, y: { type: "string" }, width: { type: "string", default: "1920" }, prex: { type: "string" }, prey: { type: "string" }, warm: { type: "boolean", default: false } } });
const ROOT = resolve(new URL("..", import.meta.url).pathname);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const vw = Number(values.width);
const k = vw / 1920;
const server = await startServer({ video: join(ROOT, "captures", "clips", `${values.frame}.webm`), port: 0 });
const profile = join(tmpdir(), `ds-dbg-${process.pid}`);
const browser = await puppeteer.launch({ executablePath: values.chrome, headless: true, pipe: true, userDataDir: profile, enableExtensions: [join(ROOT, "captures", "ext")], defaultViewport: { width: 1920, height: 1080 } });
try {
  const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 20_000 });
  const origin = sw.url().split("/").slice(0, 3).join("/");
  const s = await browser.newPage(); await s.goto(`${origin}/popup.html`); await s.evaluate(() => chrome.storage.local.set({ "channel:local:/": Date.now() })); await s.close();
  const page = await browser.newPage();
  page.on("console", (m) => { const t = m.text(); if (!/onnxruntime|VerifyEachNode|Rerunning/.test(t)) console.log("[page]", t.slice(0, 200)); });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.addStyleTag({ content: `body{margin:0;padding:0} p{display:none} video{width:${vw}px!important;height:${vw * 9 / 16}px!important;max-width:none}` });
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2, { timeout: 30_000 });
  await page.evaluate(async () => { const v = document.querySelector("video"); v.pause(); v.currentTime = 1; await new Promise((r) => v.addEventListener("seeked", r, { once: true })); });
  const x = Number(values.x) * k, y = Number(values.y) * k;
  if (values.warm) { for (let i = 0; i < 400; i++) { await page.mouse.move(x + (i % 2), y); await sleep(250); if (await page.evaluate(() => [...document.querySelectorAll('iframe[title="Card"]')].some((q) => q.style.visibility === "visible"))) { console.log(`warm tooltip after ${(i / 4).toFixed(0)} s`); break; } } }
  if (values.prex) { await page.mouse.move(Number(values.prex), Number(values.prey)); console.log("pointer on", values.prex, values.prey); await sleep(3000); const lab = await page.evaluate(() => { const b = document.querySelector('[data-duelsight="button"]'); return b ? b.outerHTML.slice(0, 300) : null; }); console.log("button:", lab); }
  for (let i = 0; i < 480; i++) {
    await page.mouse.move(x + (i % 2), y);
    await sleep(250);
    if (i % 8 === 0) {
      const f = page.frames().find((q) => q.url().endsWith("/compute.html"));
      const st = f ? await f.evaluate(() => window.__duelsightDebug?.() ?? null).catch(() => null) : null;
      const tip = await page.evaluate(() => [...document.querySelectorAll('iframe[title="Card"]')].some((q) => q.style.visibility === "visible"));
      console.log(`${(i / 4).toFixed(0)} s tooltip ${tip} ${JSON.stringify(st && { state: st.state, err: st.error, last: st.lastFrameError, analyzed: st.analyzed, frames: (st.frames || []).map((q) => q.faces) })}`);
      if (tip) break;
    }
  }
} finally { await browser.close(); server.close(); rmSync(profile, { recursive: true, force: true }); }
