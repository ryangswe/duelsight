// SPDX-License-Identifier: Apache-2.0
// A headless smoke check of a dev build on the local test page. It is not part of `npm test`.
//
//   npm run build -- --dev --release <release folder> [--images-index …]
//   npm install --no-save puppeteer-core
//   node test/smoke/smoke.mjs --chrome "<Chrome for Testing binary>" --video /path/to/clip.mp4 [--at 3.5] [--at 7]
//
// It serves the test page with your clip, opens it in Chrome with the extension loaded, pauses
// the video at each --at time, moves the pointer over a grid of the picture, and prints every
// card the tooltip named, with whether its picture loaded. It never opens a video site.
// `puppeteer-core` is not a dependency of this repository; install it yourself as above.
// Branded Chrome does not load unpacked extensions from the command line: use Chrome for Testing.

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { startServer } from "../manual/serve.mjs";

const { values } = parseArgs({
  options: {
    chrome: { type: "string" },
    video: { type: "string" },
    dist: { type: "string", default: fileURLToPath(new URL("../../dist", import.meta.url)) },
    at: { type: "string", multiple: true, default: ["2"] },
    grid: { type: "string", default: "12x7" },
    headful: { type: "boolean", default: false },
    screenshot: { type: "string" },
  },
});
if (!values.chrome || !values.video) {
  console.error("usage: node test/smoke/smoke.mjs --chrome <Chrome for Testing> --video <clip> [--at SECONDS ...]");
  process.exit(2);
}
const { default: puppeteer } = await import("puppeteer-core");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dist = resolve(values.dist);

const server = await startServer({ video: resolve(values.video), port: 0 });
const pageUrl = `http://127.0.0.1:${server.address().port}/`;
const browser = await puppeteer.launch({
  executablePath: values.chrome,
  headless: !values.headful,
  pipe: true,
  enableExtensions: [dist],
  args: ["--autoplay-policy=no-user-gesture-required", "--window-size=1400,1000"],
  defaultViewport: { width: 1360, height: 900 },
});
const requests = [];
const consoleLines = [];
try {
  const extOrigin = await turnOnTestPage(browser);
  const page = await browser.newPage();
  page.on("console", (m) => consoleLines.push(`[page ${m.type()}] ${m.text()}`));
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(pageUrl);
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2, { timeout: 30_000 });
  const info = await page.evaluate(() => {
    const v = document.querySelector("video");
    return { width: v.videoWidth, height: v.videoHeight, duration: v.duration, ua: navigator.userAgent };
  });
  console.log(`browser: ${info.ua.match(/Chrome\/[\d.]+/)?.[0]}; video ${info.width}x${info.height}, ${info.duration.toFixed(1)} s`);

  const [cols, rows] = values.grid.split("x").map(Number);
  const seen = new Map();
  let shotTaken = false;
  for (const at of values.at.map(Number)) {
    await page.evaluate(async (t) => {
      const v = document.querySelector("video");
      v.pause();
      v.currentTime = t;
      await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
    }, at);
    const rect = await page.evaluate(() => {
      const r = document.querySelector("video").getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    });
    // First look: the frames are created on the first move, the model loads, a picture is analyzed.
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const started = Date.now();
    await page.mouse.move(cx, cy);
    for (let i = 0; i < 40; i += 1) {
      await page.mouse.move(cx + (i % 2 ? 3 : -3), cy, { steps: 2 });
      await sleep(250);
      const ready = await computeState(page);
      if (ready?.analyzed) break;
    }
    console.log(`t=${at}s: first analysis after ${((Date.now() - started) / 1000).toFixed(1)} s`);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = rect.left + ((c + 0.5) / cols) * rect.width;
        const y = rect.top + ((r + 0.5) / rows) * rect.height;
        await page.mouse.move(x, y, { steps: 3 });
        await sleep(450);
        const shown = await tooltipState(page);
        if (shown && !seen.has(`${at}|${shown.name}`)) {
          seen.set(`${at}|${shown.name}`, shown);
          await sleep(1500);
          const settled = (await tooltipState(page)) ?? shown;
          console.log(`  ${settled.name} · picture: ${settled.picture} · shown ${settled.size}`);
          if (values.screenshot && !shotTaken) {
            await page.screenshot({ path: values.screenshot });
            shotTaken = true;
          }
        }
      }
    }
  }
  const status = await computeState(page);
  console.log(`compute frame: ${JSON.stringify(status)}`);
  console.log(`cards named: ${seen.size}`);
  // The popup (the master switch), the stored settings, and switching it off.
  {
    const popup = await browser.newPage();
    await popup.goto(`${extOrigin}/popup.html`);
    await sleep(500);
    const p = await popup.evaluate(async () => {
      const stored = await chrome.storage.local.get(null);
      return {
        enabled: document.getElementById("enabled").getAttribute("aria-checked"),
        updateLine: document.getElementById("update").hidden ? "hidden" : document.getElementById("update").textContent.trim(),
        settings: stored["settings.lastGood"] ? `fetched (updatedAt ${stored["settings.lastGood"].raw.updatedAt})` : "built-in default",
      };
    });
    console.log(`popup: switch ${p.enabled === "true" ? "on" : "off"}; update line ${p.updateLine}; settings in effect: ${p.settings}`);
    await popup.click("#enabled");
    await sleep(300);
    await page.bringToFront();
    await page.mouse.move(10, 10);
    await sleep(300);
    const frames = await page.evaluate(() => document.querySelectorAll("iframe").length);
    console.log(`switched off: ${frames} extension frames left in the page`);
    await popup.close();
  }
  const hosts = [...new Set(requests.map((u) => new URL(u).host))];
  console.log(`hosts requested from the page and its frames: ${hosts.join(", ")}`);
  for (const line of consoleLines.filter((l) => !/onnxruntime|VerifyEachNodeIsAssignedToAnEp|Rerunning with verbose/.test(l)).slice(0, 20)) console.log(line);
} finally {
  await browser.close();
  server.close();
}

async function frameOf(page, name) {
  return page.frames().find((f) => f.url().startsWith("chrome-extension://") && f.url().endsWith(name)) ?? null;
}

async function computeState(page) {
  const frame = await frameOf(page, "/compute.html");
  if (!frame) return null;
  return frame.evaluate(() => window.__duelsightDebug?.() ?? null).catch(() => null);
}

async function tooltipState(page) {
  const size = await page.evaluate(() => {
    const f = [...document.querySelectorAll("iframe")].find((i) => i.src.endsWith("/tooltip.html"));
    return f && getComputedStyle(f).visibility === "visible" ? `${f.style.width} x ${f.style.height}` : null;
  });
  if (!size) return null;
  const frame = await frameOf(page, "/tooltip.html");
  if (!frame) return null;
  const state = await frame.evaluate(() => {
    const img = document.getElementById("img");
    const art = document.getElementById("art");
    const pill = document.getElementById("pill");
    return {
      // The picture's alt text is the card's name; without a picture, the pill holds it.
      name: art.hidden ? pill.textContent : img.alt,
      picture: art.hidden ? "none (name only)" : art.classList.contains("loading") ? "loading" : img.naturalWidth > 0 ? `${img.naturalWidth}x${img.naturalHeight}` : "not decoded",
    };
  });
  return { ...state, size };
}

/** The extension's origin, from its background service worker. */
async function extensionOrigin(browser) {
  const target = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 15_000 });
  return target.url().split("/").slice(0, 3).join("/");
}

/** Turn card hovers on for the local test page (the in-player button's job, done directly). */
async function turnOnTestPage(browser) {
  const origin = await extensionOrigin(browser);
  const p = await browser.newPage();
  await p.goto(`${origin}/popup.html`);
  await p.evaluate(() => chrome.storage.local.set({ "channel:local:/": Date.now() }));
  await p.close();
  return origin;
}
