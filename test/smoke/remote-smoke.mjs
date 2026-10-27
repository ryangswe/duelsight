// SPDX-License-Identifier: Apache-2.0
// A headless smoke check of the remote release pointer (cdn/SETTINGS.md, "release"), against a
// local stand-in for the CDN. It is not part of `npm test`, and it never opens a video site.
//
//   npm run build -- --dev --release <bundled release folder> --out <dist>
//   npm install --no-save puppeteer-core
//   node test/smoke/remote-smoke.mjs --chrome <Chrome for Testing> --dist <dist> --video <clip>
//        --remote <remote release folder> [--expect-card "<name only the remote release has>"] [--at 2 --at 5]
//
// The stand-in is an HTTPS server on 127.0.0.1 with a throwaway self-signed certificate; Chrome is
// told to send cdn.<host> there (--host-resolver-rules) and to accept the certificate. It serves
// config.json with the pointer of each case, the remote release's folder, and logs every request,
// so what the browser really downloaded (not what it read from its cache) is counted.
//
// Cases, each in a fresh browser profile:
//   remote-ok     the pointer names the remote release: it loads; with the same models as the
//                 bundled release only the bank, identity groups and catalog are downloaded; the
//                 card only the remote release has gets its tooltip (facts channel).
//                 Then the cache: a second tab of the same site downloads nothing again; a tab of
//                 another site (localhost) shows whether the browser keeps one cache per site.
//   sha-mismatch  the pointer's sha256 is wrong: the bundled release, reason doc-sha, recorded.
//   unreachable   the release's folder drops the connection: the bundled release, not recorded.
//   version       the pointer asks for a newer extension: the bundled release, nothing fetched.
//
// --live: the same browser check against the real CDN, after a pointer move (MAINTAINING.md, "New cards").
//
//   node test/smoke/remote-smoke.mjs --live --expect-id <the id the pointer must name>
//        --chrome <Chrome for Testing> --dist <dist> --video <clip> [--expect-card "<a new card>"] [--at 2]
//
// No stand-in: config.json and the release come from the real CDN. It first reads config.json itself
// and stops unless the pointer names --expect-id. Then one case, "live", in a fresh profile: the
// pointer is the one in effect; the decision is the remote release (reason ok), or the bundled one
// (reason same-as-bundled) when the build bundles that id; recognition is ready; no skip-list entry;
// one log line with no page data; --expect-card, if given, gets its tooltip. The page is still the
// local test page with your clip (a frame of the month's new cards makes --expect-card meaningful);
// it never opens a video site. Use the dist of the store build (`npm run build -- --dev` with the
// release the store package bundles), so "same-as-bundled" and "ok" mean what they mean for viewers.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { createServer } from "node:https";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

import { startServer } from "../manual/serve.mjs";

const { values } = parseArgs({
  options: {
    chrome: { type: "string" },
    dist: { type: "string" },
    video: { type: "string" },
    remote: { type: "string" },
    "expect-card": { type: "string" },
    at: { type: "string", multiple: true, default: ["2"] },
    grid: { type: "string", default: "12x7" },
    only: { type: "string" },
    live: { type: "boolean", default: false },
    "expect-id": { type: "string" },
  },
});
const live = values.live;
if (!values.chrome || !values.dist || !values.video || (live ? !/^[0-9a-f]{16}$/.test(values["expect-id"] ?? "") : !values.remote)) {
  console.error("usage: node test/smoke/remote-smoke.mjs --chrome <Chrome for Testing> --dist <dist> --video <clip> --remote <release folder>");
  console.error("   or: node test/smoke/remote-smoke.mjs --live --expect-id <16 hex digits> --chrome <Chrome for Testing> --dist <dist> --video <clip>");
  process.exit(2);
}
const { default: puppeteer } = await import("puppeteer-core");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dist = resolve(values.dist);
const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf-8"));
const bundledId = JSON.parse(readFileSync(join(dist, "release", "release.json"), "utf-8")).id;
const cdnBase = JSON.parse(readFileSync(new URL("../../duelsight.config.json", import.meta.url), "utf-8")).cdnBase;
const cdnHost = new URL(cdnBase).host;
const sha = (b) => createHash("sha256").update(b).digest("hex");

let cdn = null;
let caseArgs = [];
let cases;
const state = { config: null, log: [], dropId: "deaddeaddeaddead" };
if (live) {
  // ---------------------------------------------------------------- the real CDN
  const res = await fetch(new URL(`config.json?t=${Date.now()}`, cdnBase.endsWith("/") ? cdnBase : `${cdnBase}/`), { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`${cdnHost}/config.json: HTTP ${res.status}`);
  const config = await res.json();
  const id = config.release?.id ?? null;
  console.log(`live config.json: release ${id ?? "none"}; the build bundles ${bundledId}; extension ${manifest.version}`);
  if (id !== values["expect-id"]) {
    console.error(`the live pointer names ${id ?? "no release"}, not ${values["expect-id"]}: run dscdn.py verify-release-live first`);
    process.exit(1);
  }
  const expect = id === bundledId ? { source: "bundled", reason: "same-as-bundled" } : { source: "remote", reason: "ok" };
  cases = [{ name: "live", pointer: config.release, expect }];
} else {
  const remoteDir = resolve(values.remote);
  const liveConfig = JSON.parse(readFileSync(new URL("../../cdn/config.json", import.meta.url), "utf-8"));
  const remoteDoc = readFileSync(join(remoteDir, "release.json"));
  const remoteId = JSON.parse(remoteDoc).id;
  state.config = liveConfig;

  // ---------------------------------------------------------------- the CDN stand-in
  const certDir = mkdtempSync(join(tmpdir(), "remote-smoke-"));
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-keyout", join(certDir, "key.pem"), "-out", join(certDir, "cert.pem"),
    "-subj", `/CN=${cdnHost}`, "-addext", `subjectAltName=DNS:${cdnHost}`], { stdio: "ignore" });
  // Trusted by its key's hash (--ignore-certificate-errors-spki-list), so Chrome treats it as a valid
  // certificate and keeps the responses in its HTTP cache (it caches nothing from a connection with a
  // certificate error).
  const spki = execFileSync("sh", ["-c", `openssl x509 -pubkey -noout -in "${join(certDir, "cert.pem")}" | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`], { encoding: "utf-8" }).trim();
  cdn = createServer({ key: readFileSync(join(certDir, "key.pem")), cert: readFileSync(join(certDir, "cert.pem")) }, (req, res) => {
    const path = new URL(req.url ?? "/", `https://${cdnHost}`).pathname;
    const send = (status, body, type, cache) => {
      state.log.push({ path, status, bytes: body.length });
      res.writeHead(status, { "content-type": type, "cache-control": cache, "access-control-allow-origin": "*" }).end(body);
    };
    if (path === "/config.json") return send(200, Buffer.from(JSON.stringify(state.config)), "application/json", "public, max-age=300");
    const m = /^\/vision\/releases\/([0-9a-f]{16})\/([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(path);
    if (m && m[1] === state.dropId) {
      state.log.push({ path, status: "dropped", bytes: 0 });
      return req.socket.destroy();
    }
    if (m && m[1] === remoteId) {
      try {
        const body = readFileSync(join(remoteDir, m[2]));
        return send(200, body, m[2].endsWith(".onnx") ? "application/octet-stream" : "application/json", "public, max-age=31536000, immutable");
      } catch {}
    }
    send(404, Buffer.from("not here"), "text/plain", "no-store");
  });
  await new Promise((r) => cdn.listen(0, "127.0.0.1", r));
  caseArgs = [`--host-resolver-rules=MAP ${cdnHost} 127.0.0.1:${cdn.address().port}`, `--ignore-certificate-errors-spki-list=${spki}`];

  const pointer = (over = {}) => ({ id: remoteId, path: `vision/releases/${remoteId}/release.json`, sha256: sha(remoteDoc), minimumExtensionVersion: manifest.version, ...over });
  cases = [
    { name: "remote-ok", pointer: pointer(), expect: { source: "remote", reason: "ok" }, cacheSplit: true },
    { name: "sha-mismatch", pointer: pointer({ sha256: "0".repeat(64) }), expect: { source: "bundled", reason: "doc-sha" }, skip: true },
    { name: "unreachable", pointer: { ...pointer(), id: state.dropId, path: `vision/releases/${state.dropId}/release.json` }, expect: { source: "bundled", reason: "unreachable" } },
    { name: "version", pointer: pointer({ minimumExtensionVersion: "99.0.0" }), expect: { source: "bundled", reason: "version" } },
  ].filter((c) => !values.only || values.only.split(",").includes(c.name));
}
const page = await startServer({ video: resolve(values.video), port: 0 });
const pagePort = page.address().port;

let failures = 0;
const check = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures += 1;
};

try {
  for (const c of cases) {
    console.log(`\n== ${c.name}`);
    if (!live) state.config = { ...state.config, release: c.pointer };
    state.log = [];
    const browser = await puppeteer.launch({
      executablePath: values.chrome,
      headless: true,
      pipe: true,
      enableExtensions: [dist],
      args: ["--autoplay-policy=no-user-gesture-required", ...caseArgs, "--window-size=1400,1000"],
      defaultViewport: { width: 1360, height: 900 },
    });
    try {
      const origin = await extensionOrigin(browser);
      await waitForSettings(browser, origin, c.pointer);
      const tab = await browser.newPage();
      const consoleLines = [];
      tab.on("console", (m) => consoleLines.push(m.text()));
      const first = await hoverPage(tab, `http://127.0.0.1:${pagePort}/`);
      const d = first.compute?.release?.decision;
      console.log(`  decision: ${JSON.stringify(d)}`);
      console.log(`  named: ${[...first.names].join(", ") || "nothing"} (analyzed ${first.compute?.analyzed}, last frame error ${first.compute?.lastFrameError})`);
      check(d && d.source === c.expect.source && d.reason.startsWith(c.expect.reason), `source=${c.expect.source} reason=${c.expect.reason}`);
      check(first.compute?.state === "ready", `recognition ready (${first.compute?.state})`);
      const releaseRequests = state.log.filter((l) => l.path.startsWith("/vision/releases/"));
      if (!live) console.log(`  CDN requests: ${releaseRequests.map((l) => `${l.path.split("/").pop()} ${l.status} ${l.bytes}`).join("; ") || "none"}`);
      if (c.name === "remote-ok") {
        const files = releaseRequests.map((l) => l.path.split("/").pop()).sort();
        check(JSON.stringify(files) === JSON.stringify(["bank.json", "catalog.json", "identity-groups.json", "release.json"].sort()), "only release.json, bank, groups and catalog downloaded (models reused)");
        check(d?.reused === 2, `reused ${d?.reused}/5`);
        if (values["expect-card"]) check(first.names.has(values["expect-card"]), `the remote release's own card shows its tooltip: ${values["expect-card"]}`);
        const line = consoleLines.find((l) => l.includes("release source="));
        check(Boolean(line) && !/127\.0\.0\.1|video|channel/.test(line), `one log line, no page data: ${line}`);
      }
      if (c.name === "version") check(releaseRequests.length === 0, "nothing fetched from the release folder");
      if (c.name === "live") {
        check(d?.pointer === values["expect-id"], `the decision names the pointer ${values["expect-id"]} (${d?.pointer})`);
        console.log(`  reused ${d?.reused ?? "-"}/5, downloaded ${d?.downloaded ?? 0} bytes, ${d?.ms ?? "-"} ms`);
        if (values["expect-card"]) check(first.names.has(values["expect-card"]), `the new card shows its tooltip: ${values["expect-card"]}`);
        const line = consoleLines.find((l) => l.includes("release source="));
        check(Boolean(line) && !/127\.0\.0\.1|video|channel/.test(line), `one log line, no page data: ${line}`);
      }
      const stored = await storageOf(browser, origin);
      if (c.skip) check(stored.releaseSkip?.id === c.pointer.id && stored.releaseSkip?.reason === c.expect.reason, `skip-list entry: ${JSON.stringify(stored.releaseSkip)}`);
      else check(!stored.releaseSkip, `no skip-list entry (${JSON.stringify(stored.releaseSkip ?? null)})`);
      if (c.cacheSplit) {
        for (const [label, url] of [["same site, second tab", `http://127.0.0.1:${pagePort}/`], ["another site (localhost)", `http://localhost:${pagePort}/`]]) {
          const before = state.log.length;
          const t = await browser.newPage();
          const r = await hoverPage(t, url);
          const fetched = state.log.slice(before).filter((l) => l.path.startsWith("/vision/releases/"));
          const bytes = fetched.reduce((s, l) => s + l.bytes, 0);
          console.log(`  cache, ${label}: ${r.compute?.release?.decision?.source} ${r.compute?.release?.decision?.reason}; downloaded from the CDN again: ${fetched.length ? `${fetched.length} files, ${bytes} bytes` : "nothing"}`);
          await t.close();
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  cdn?.close();
  page.close();
}
console.log(`\nremote smoke: ${failures ? `${failures} failure(s)` : "all checks passed"}`);
process.exit(failures ? 1 : 0);

// ------------------------------------------------------------------ helpers

async function extensionOrigin(browser) {
  const target = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 15_000 });
  return target.url().split("/").slice(0, 3).join("/");
}

async function storageOf(browser, origin) {
  const p = await browser.newPage();
  await p.goto(`${origin}/popup.html`);
  const s = await p.evaluate(() => chrome.storage.local.get(null));
  await p.close();
  return s;
}

/** The background fetches config.json at start-up; wait until the copy in effect has this pointer. */
async function waitForSettings(browser, origin, want) {
  for (let i = 0; i < 40; i += 1) {
    const s = await storageOf(browser, origin);
    const canon = (o) => JSON.stringify(o, o && typeof o === "object" ? Object.keys(o).sort() : undefined);
    if (canon(s["settings.lastGood"]?.raw?.release) === canon(want)) return;
    await sleep(250);
  }
  const s = await storageOf(browser, origin);
  throw new Error(`the background did not store the case's config.json (CDN saw: ${JSON.stringify(state.log)}; stored: ${JSON.stringify(s["settings.lastGood"] ?? null).slice(0, 300)}; last attempt ${s["settings.lastAttemptAt"]})`);
}

async function frameOf(tab, name) {
  return tab.frames().find((f) => f.url().startsWith("chrome-extension://") && f.url().endsWith(name)) ?? null;
}

async function computeState(tab) {
  const frame = await frameOf(tab, "/compute.html");
  return frame ? frame.evaluate(() => window.__duelsightDebug?.() ?? null).catch(() => null) : null;
}

async function tooltipName(tab) {
  const visible = await tab.evaluate(() => {
    const f = [...document.querySelectorAll("iframe")].find((i) => i.src.endsWith("/tooltip.html"));
    return Boolean(f && getComputedStyle(f).visibility === "visible");
  });
  if (!visible) return null;
  const frame = await frameOf(tab, "/tooltip.html");
  return frame
    ? frame.evaluate(() => (document.getElementById("art").hidden ? document.getElementById("pill").textContent : document.getElementById("img").alt)).catch(() => null)
    : null;
}

/** Open the test page, hover a grid at each --at time, and return the names shown and the compute frame's state. */
async function hoverPage(tab, url) {
  await tab.goto(url);
  await tab.waitForFunction(() => document.querySelector("video")?.readyState >= 2, { timeout: 30_000 });
  const [cols, rows] = values.grid.split("x").map(Number);
  const names = new Set();
  for (const at of values.at.map(Number)) {
    await tab.evaluate(async (t) => {
      const v = document.querySelector("video");
      v.pause();
      v.currentTime = t;
      await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
    }, at);
    const rect = await tab.evaluate(() => {
      const r = document.querySelector("video").getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    });
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    await tab.mouse.move(cx, cy);
    for (let i = 0; i < 80; i += 1) {
      await tab.mouse.move(cx + (i % 2 ? 3 : -3), cy, { steps: 2 });
      await sleep(250);
      const s = await computeState(tab);
      if (s?.analyzed || s?.state === "failed") break;
    }
    for (let r = 0; r < rows; r += 1) {
      for (let col = 0; col < cols; col += 1) {
        await tab.mouse.move(rect.left + ((col + 0.5) / cols) * rect.width, rect.top + ((r + 0.5) / rows) * rect.height, { steps: 3 });
        await sleep(400);
        const name = await tooltipName(tab);
        if (name) names.add(name);
      }
    }
  }
  return { names, compute: await computeState(tab) };
}
