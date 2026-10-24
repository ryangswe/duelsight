// SPDX-License-Identifier: Apache-2.0
// Check a release the way the extension's runtime will, before (or after) it goes on the CDN.
//
//   node scripts/verify-remote-release.mjs --dir <release folder> [--expect-id ID] [--sessions]
//   node scripts/verify-remote-release.mjs --url https://<host>/vision/releases/<id>/release.json [--expect-id ID] [--sessions]
//
// Without --sessions: the vendored runtime's `loadReleaseData` (as scripts/build.mjs uses it): the
// document, every pinned file against its size and SHA-256, the bank, catalog and identity groups
// against each other, and the ONNX Runtime pin. Data only, no model is started.
// --sessions: the vendored `loadRelease` in Node on the "wasm" provider, which also creates both
// ONNX Runtime sessions (use it when the detector or recognizer differs from the live release's).
// With --url the files are fetched over https, as a browser would, with no cookies.
//
// Prints one JSON line {ok, id, bankEntries, bankCards, catalogCards, sessions, reason} and exits 0
// only when everything holds (and the id is --expect-id, when given). Used by cdn/dscdn.py.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    dir: { type: "string" },
    url: { type: "string" },
    "expect-id": { type: "string" },
    sessions: { type: "boolean", default: false },
  },
});
if (!values.dir === !values.url) {
  console.error("usage: node scripts/verify-remote-release.mjs (--dir DIR | --url URL) [--expect-id ID] [--sessions]");
  process.exit(2);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const vendorDir = join(root, "vendor", "cardvision-browser");
const vendor = JSON.parse(readFileSync(join(vendorDir, "VENDOR.json"), "utf-8"));
const { loadReleaseData, loadRelease } = await import(pathToFileURL(join(vendorDir, "cardvision.js")).href);

const fileFetch = async (url) => {
  const path = fileURLToPath(url);
  if (!existsSync(path)) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
  const bytes = readFileSync(path);
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const httpsFetch = (url) => fetch(url, { credentials: "omit", headers: { "User-Agent": "duelsight-cdn-verify/1" } });
const digestSha256Hex = async (bytes) => createHash("sha256").update(Buffer.from(bytes)).digest("hex");

const releaseUrl = values.dir ? pathToFileURL(join(resolve(values.dir), "release.json")).href : values.url;
if (values.url && !/^https:\/\/[^/]+\/vision\/releases\/[0-9a-f]{16}\/release\.json$/.test(values.url)) {
  console.log(JSON.stringify({ ok: false, reason: "the url is not https://<host>/vision/releases/<id>/release.json" }));
  process.exit(1);
}
const deps = { fetchFn: values.dir ? fileFetch : httpsFetch, digestSha256Hex };
const out = { ok: false, id: null, bankEntries: null, bankCards: null, catalogCards: null, sessions: values.sessions ? "not run" : "skipped", reason: null };

const checked = await loadReleaseData(releaseUrl, deps, { ortWeb: vendor.onnxruntimeWeb });
if (!checked.ok) {
  out.reason = checked.reason;
} else {
  const r = checked.data.release;
  Object.assign(out, { id: r.id, bankEntries: r.bank.entryCount, bankCards: r.bank.cardCount, catalogCards: r.catalog.cardCount });
  if (values["expect-id"] && r.id !== values["expect-id"]) out.reason = `id ${r.id} is not the expected ${values["expect-id"]}`;
  else if (values.sessions) {
    try {
      // ONNX Runtime's wasm files: this repository's pinned onnxruntime-web, the pair the build
      // copies beside the worker (VENDOR.json ortFiles).
      const ortDist = join(dirname(createRequire(import.meta.url).resolve("onnxruntime-web")), "..", "dist");
      const loaded = await loadRelease(releaseUrl, { providers: ["wasm"], deps, wasmPaths: `${pathToFileURL(ortDist).href}/` });
      out.sessions = `ok (detector ${loaded.backend.detector}, recognizer ${loaded.backend.recognizer})`;
      await loaded.dispose();
      out.ok = true;
    } catch (error) {
      out.sessions = "failed";
      out.reason = `sessions: ${error && error.reason ? error.reason : String(error)}`;
    }
  } else out.ok = true;
}
console.log(JSON.stringify(out));
process.exit(out.ok ? 0 : 1);
