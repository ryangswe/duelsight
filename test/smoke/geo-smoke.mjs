// SPDX-License-Identifier: Apache-2.0
// A headless smoke check of the geometric stage, on a dev build whose index address points at a
// local copy of the packed index (the release build keeps the CDN address and the pin).
//
//   npm run build -- --dev --release <release> --geo-manifest-url http://127.0.0.1:8771/manifest.json
//   node test/smoke/geo-smoke.mjs --chrome <Chrome for Testing> --video <clip> --geo-dir <packed index folder> [--at 2] [--netlog <file>]
//
// It checks: the stage goes loading → ready (and its bytes), faces carry geometric evidence, the
// per-frame times, the stage state, the index kept in the Cache API (a second page load does not
// download the shards again), and that `geometric: false` in the settings turns the stage off.
// It never opens a video site. `puppeteer-core` is not a dependency: install it yourself.

import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { startServer } from "../manual/serve.mjs";

const { values } = parseArgs({
  options: {
    chrome: { type: "string" },
    video: { type: "string" },
    "geo-dir": { type: "string" },
    "geo-port": { type: "string", default: "8771" },
    dist: { type: "string", default: fileURLToPath(new URL("../../dist", import.meta.url)) },
    at: { type: "string", default: "2" },
    netlog: { type: "string" },
    grid: { type: "string", default: "10x6" },
  },
});
if (!values.chrome || !values.video || !values["geo-dir"]) {
  console.error("usage: node test/smoke/geo-smoke.mjs --chrome <CfT> --video <clip> --geo-dir <packed index folder>");
  process.exit(2);
}
const { default: puppeteer } = await import("puppeteer-core");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const geoDir = resolve(values["geo-dir"]);

// The stand-in for the CDN: the packed index, with the CORS header the CDN sends.
const geoRequests = [];
const geo = createServer((req, res) => {
  const name = new URL(req.url, "http://x").pathname.slice(1);
  geoRequests.push(name);
  if (!/^(manifest\.json|shard-\d+\.bin)$/.test(name)) return void res.writeHead(404).end();
  const path = join(geoDir, name);
  res.writeHead(200, { "access-control-allow-origin": "*", "content-length": statSync(path).size, "content-type": name.endsWith(".json") ? "application/json" : "application/octet-stream" });
  createReadStream(path).pipe(res);
});
await new Promise((r) => geo.listen(Number(values["geo-port"]), "127.0.0.1", r));

const page0 = await startServer({ video: resolve(values.video), port: 0 });
const pageUrl = `http://127.0.0.1:${page0.address().port}/`;
const browser = await puppeteer.launch({
  executablePath: values.chrome,
  headless: true,
  pipe: true,
  enableExtensions: [resolve(values.dist)],
  args: ["--autoplay-policy=no-user-gesture-required", "--enable-unsafe-webgpu", ...(values.netlog ? [`--log-net-log=${values.netlog}`, "--net-log-capture-mode=Default"] : [])],
  defaultViewport: { width: 1360, height: 900 },
});
const t0 = Date.now();
const out = (...a) => console.log(...a);
try {
  await turnOnTestPage(browser);
  const page = await browser.newPage();
  const consoleLines = [];
  page.on("console", (m) => consoleLines.push(`[${m.type()}] ${m.text()}`));

  const run = async (label, { expectReady }) => {
    const before = geoRequests.length;
    await page.goto(pageUrl);
    await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2, { timeout: 30_000 });
    await page.evaluate(async (t) => {
      const v = document.querySelector("video");
      v.pause();
      v.currentTime = t;
      await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
    }, Number(values.at));
    const rect = await page.evaluate(() => {
      const r = document.querySelector("video").getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    });
    const started = Date.now();
    let debug = null;
    const seen = [];
    // Keep the pointer moving over the picture until the stage settles (ready or off).
    for (let i = 0; i < 600; i += 1) {
      await page.mouse.move(rect.left + rect.width * (0.3 + (i % 7) * 0.05), rect.top + rect.height * (0.4 + (i % 3) * 0.1), { steps: 2 });
      await sleep(200);
      debug = await computeDebug(page);
      const g = debug?.geometric?.state ?? null;
      if (seen.at(-1) !== g) seen.push(g);
      if (expectReady ? g === "ready" || g === "off" : debug?.analyzed > 2) break;
    }
    const settledMs = Date.now() - started;
    // Hover over a grid so that faces are analyzed with the stage.
    const [cols, rows] = values.grid.split("x").map(Number);
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1) {
        await page.mouse.move(rect.left + ((c + 0.5) / cols) * rect.width, rect.top + ((r + 0.5) / rows) * rect.height, { steps: 2 });
        await sleep(300);
      }
    await sleep(1500);
    debug = await computeDebug(page);
    const frames = debug?.frames ?? [];
    const withStage = frames.filter((f) => f.geometricMs !== null);
    const q = (xs, p) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))] : null);
    const shardsFetched = geoRequests.slice(before).filter((n) => n.startsWith("shard-")).length;
    out(`${label}: stage states ${seen.map(String).join(" → ")} after ${(settledMs / 1000).toFixed(1)} s; bytes ${debug?.geometricBytes ?? "-"}; reason ${debug?.geometric?.reason ?? "-"}`);
    out(`  backend ${debug?.backend}; frames ${frames.length}, with the stage ${withStage.length}; faces ${frames.reduce((a, f) => a + f.faces, 0)}, verified ${frames.reduce((a, f) => a + f.verified, 0)}, answer changed by the stage ${frames.reduce((a, f) => a + f.changed, 0)}`);
    if (withStage.length) {
      const g = withStage.map((f) => f.geometricMs);
      const a = withStage.map((f) => f.analyzeMs);
      out(`  per frame with the stage: geometricMs median ${q(g, 0.5)?.toFixed(1)} p90 ${q(g, 0.9)?.toFixed(1)} max ${Math.max(...g).toFixed(1)}; analyzeMs median ${q(a, 0.5)?.toFixed(1)} p90 ${q(a, 0.9)?.toFixed(1)}`);
    }
    out(`  local index server: ${geoRequests.slice(before).join(", ") || "no request"} (${shardsFetched} shards)`);
    const cache = await page.frames().find((f) => f.url().endsWith("/compute.html"))?.evaluate(async () => {
      const names = await caches.keys();
      const entries = [];
      for (const n of names) entries.push(`${n}: ${(await (await caches.open(n)).keys()).length} entries`);
      return { names: entries, persisted: await navigator.storage.persisted() };
    });
    out(`  Cache API in the extension origin: ${cache ? `${cache.names.join("; ") || "empty"}; persisted ${cache.persisted}` : "-"}`);
    out(`  stage state (dev debug): ${debug?.geometric ? `${debug.geometric.state}${debug.geometric.reason ? ` (${debug.geometric.reason})` : ""}` : "none reported"}`);
    return debug;
  };

  await run("first load", { expectReady: true });
  await run("second load (same browser)", { expectReady: true });

  // The kill switch: a stored settings file with geometric: false, fresh enough not to be refetched.
  const origin = page.frames().find((f) => f.url().endsWith("/compute.html")).url().split("/").slice(0, 3).join("/");
  const p = await browser.newPage();
  await p.goto(`${origin}/popup.html`);
  const config = JSON.parse(readFileSync(fileURLToPath(new URL("../../cdn/config.json", import.meta.url)), "utf-8"));
  await p.evaluate(async (raw) => {
    const now = Date.now();
    await chrome.storage.local.set({ "settings.lastGood": { raw, fetchedAt: now }, "settings.lastAttemptAt": now });
    await chrome.storage.session.remove("geometric.status");
  }, { ...config, geometric: false });
  await p.close();
  await page.bringToFront();
  await run("with geometric: false", { expectReady: false });

  const errors = consoleLines.filter((l) => /^\[error\]/.test(l) && !/favicon|404 \(Not Found\)/.test(l));
  out(`page console errors: ${errors.length ? errors.slice(0, 5).join(" | ") : "none"}`);
  out(`total ${((Date.now() - t0) / 1000).toFixed(0)} s`);
} finally {
  await browser.close();
  page0.close();
  geo.close();
}

async function computeDebug(page) {
  const f = page.frames().find((fr) => fr.url().endsWith("/compute.html"));
  if (!f) return null;
  return f.evaluate(() => window.__kenbunshokuDebug?.() ?? null).catch(() => null);
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
