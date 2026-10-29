// node/verify-release.ts
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
var DEFAULT_USER_AGENT = "cardvision-verify/1";
var URL_SHAPE = /^https:\/\/[^/]+\/vision\/releases\/[0-9a-f]{16}\/release\.json$/;
var digestSha256Hex = async (bytes) => createHash("sha256").update(Buffer.from(bytes)).digest("hex");
var fileFetch = async (url) => {
  const path = fileURLToPath(url);
  if (!existsSync(path)) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
  const bytes = readFileSync(path);
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
async function verifyRelease(runtime, options, fetchFn) {
  const out = { ok: false, id: null, bankEntries: null, bankCards: null, catalogCards: null, sessions: options.sessions ? "not run" : "skipped", reason: null };
  if (options.url && !URL_SHAPE.test(options.url)) {
    out.reason = "the url is not https://<host>/vision/releases/<id>/release.json";
    return out;
  }
  const releaseUrl = options.dir ? pathToFileURL(join(resolve(options.dir), "release.json")).href : options.url;
  const request = fetchFn ?? ((url, init) => fetch(url, init));
  const httpsFetch = (url) => request(url, { credentials: "omit", headers: { "User-Agent": options.userAgent } });
  const deps = { fetchFn: options.dir ? fileFetch : httpsFetch, digestSha256Hex };
  const checked = await runtime.loadReleaseData(releaseUrl, deps, options.ortWeb === void 0 ? {} : { ortWeb: options.ortWeb });
  if (!checked.ok) {
    out.reason = checked.reason;
    return out;
  }
  const r = checked.data.release;
  Object.assign(out, { id: r.id, bankEntries: r.bank.entryCount, bankCards: r.bank.cardCount, catalogCards: r.catalog.cardCount });
  if (options.expectId && r.id !== options.expectId) {
    out.reason = `id ${r.id} is not the expected ${options.expectId}`;
  } else if (options.sessions) {
    try {
      const loaded = await runtime.loadRelease(releaseUrl, { providers: ["wasm"], deps, ...options.wasmPaths !== void 0 ? { wasmPaths: options.wasmPaths } : {} });
      out.sessions = `ok (detector ${loaded.backend.detector}, recognizer ${loaded.backend.recognizer})`;
      await loaded.dispose();
      out.ok = true;
    } catch (error) {
      out.sessions = "failed";
      const reason = error?.reason;
      out.reason = `sessions: ${reason ? String(reason) : String(error)}`;
    }
  } else out.ok = true;
  return out;
}
function installedOrtDir() {
  try {
    let dir = dirname(createRequire(import.meta.url).resolve("onnxruntime-web"));
    for (; dir !== dirname(dir); dir = dirname(dir)) {
      const file = join(dir, "package.json");
      if (!existsSync(file)) continue;
      if (JSON.parse(readFileSync(file, "utf-8")).name === "onnxruntime-web") return dir;
    }
  } catch {
  }
  return void 0;
}
function isEntry() {
  try {
    return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
var USAGE = "usage: node verify-release.mjs (--dir DIR | --url URL) [--expect-id ID] [--sessions] [--ort-web VERSION] [--user-agent TEXT]";
async function main(argv) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        dir: { type: "string" },
        url: { type: "string" },
        "expect-id": { type: "string" },
        sessions: { type: "boolean", default: false },
        "ort-web": { type: "string" },
        "user-agent": { type: "string", default: DEFAULT_USER_AGENT },
        help: { type: "boolean", short: "h", default: false }
      }
    }));
  } catch (error) {
    console.error(`${error.message}
${USAGE}`);
    return 2;
  }
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  if (!values.dir === !values.url) {
    console.error(USAGE);
    return 2;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const runtimeDir = [here, dirname(here)].find((dir) => existsSync(join(dir, "cardvision.js")));
  if (!runtimeDir) {
    console.error(`cardvision.js is neither beside this script nor one folder up (${here})`);
    return 2;
  }
  const runtime = await import(pathToFileURL(join(runtimeDir, "cardvision.js")).href);
  const ortDir = installedOrtDir();
  let ortWeb = values["ort-web"];
  const vendorFile = join(runtimeDir, "VENDOR.json");
  if (ortWeb === void 0 && existsSync(vendorFile)) {
    ortWeb = JSON.parse(readFileSync(vendorFile, "utf-8")).onnxruntimeWeb;
    if (ortWeb === void 0) {
      console.error(`${vendorFile} has no onnxruntimeWeb: pass --ort-web VERSION`);
      return 2;
    }
  } else if (ortWeb === void 0 && ortDir !== void 0) {
    ortWeb = JSON.parse(readFileSync(join(ortDir, "package.json"), "utf-8")).version;
  }
  if (ortWeb === void 0) {
    console.error("no ONNX Runtime pin to check the release against: pass --ort-web VERSION");
    return 2;
  }
  let wasmDir;
  if (readdirSync(runtimeDir).some((name) => /^ort-wasm-.*\.wasm$/.test(name))) wasmDir = runtimeDir;
  else if (ortDir !== void 0 && existsSync(join(ortDir, "dist"))) wasmDir = join(ortDir, "dist");
  const out = await verifyRelease(runtime, {
    ...values.dir !== void 0 ? { dir: values.dir } : {},
    ...values.url !== void 0 ? { url: values.url } : {},
    ...values["expect-id"] !== void 0 ? { expectId: values["expect-id"] } : {},
    sessions: values.sessions,
    userAgent: values["user-agent"],
    ortWeb,
    ...wasmDir !== void 0 ? { wasmPaths: `${pathToFileURL(wasmDir).href}/` } : {}
  });
  console.log(JSON.stringify(out));
  return out.ok ? 0 : 1;
}
if (isEntry()) process.exit(await main(process.argv.slice(2)));
export {
  DEFAULT_USER_AGENT,
  verifyRelease
};
