// SPDX-License-Identifier: Apache-2.0
// Build the unpacked extension into dist/ (not kept in the repository).
//
//   npm run build -- --release <release folder> [--images-index <images.jsonl>] [--dev] [--out dist]
//
// --release       A release folder as `cardvision build-release` writes it: release.json and the
//                 files it pins. It is checked with the runtime's own verification (every file
//                 against its SHA-256 and size, the components against each other, the ONNX
//                 Runtime version) and copied into dist/release/. It is never committed.
// --images-index  The image index of the card mirror (JSON Lines, one picture per line with
//                 `file`, `url`, `is_placeholder`): builds the `{sourceFile}` map for the
//                 `optcgapi` fallback afresh. Without it, the committed data/source-files.json
//                 is used.
// --dev           A development build: also runs on the local test page (http://127.0.0.1).
// --store         A Chrome Web Store build: the manifest has no `key` (the store assigns the ID).
//                 Other builds carry the public key that fixes the ID of unpacked installs.
//
// Everything that makes this build Kenbunshoku (names, sites, hosts, settings address, the
// printed-number rule, the geometric stage, links, the zip name) comes from the config, which is
// checked first (scripts/fork-config.mjs); the code reads the same file (src/config.ts), which
// the bundles get as checked here, without its `$comment`.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { build } from "esbuild";

import { buildManifest } from "./manifest.mjs";
import { buildCardTable, buildSourceFileMaps } from "./card-data.mjs";
import { CONFIG_PATH, geometricIndexProblem, ICON_SIZES, loadForkConfig } from "./fork-config.mjs";
import { LEGAL_FILES, releaseLegalProblem } from "./release-legal.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const { values } = parseArgs({
  options: {
    release: { type: "string" },
    "images-index": { type: "string" },
    dev: { type: "boolean", default: false },
    store: { type: "boolean", default: false },
    "geo-manifest-url": { type: "string" },
    out: { type: "string", default: "dist" },
  },
});
if (!values.release) {
  console.error("usage: npm run build -- --release <release folder> [--images-index <images.jsonl>] [--dev]");
  process.exit(2);
}
if (values["geo-manifest-url"] && !values.dev) {
  console.error("--geo-manifest-url is for dev builds only: a release build names the index on the CDN");
  process.exit(2);
}
if (values.dev && values.store) {
  console.error("--dev and --store do not go together");
  process.exit(2);
}
let config;
try {
  config = loadForkConfig();
} catch (e) {
  console.error(`the config is not usable: ${e.message}`);
  process.exit(1);
}
if (values["geo-manifest-url"] && !config.geometric) {
  console.error("--geo-manifest-url: this config has no geometric stage");
  process.exit(2);
}
const releaseDir = resolve(values.release);
// The models' license, notice and provenance ship beside them (checked once the release is read).
const legalDir = join(root, "release-legal");
const out = resolve(root, values.out);
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const vendorDir = join(root, "vendor", "cardvision-browser");
const vendor = JSON.parse(readFileSync(join(vendorDir, "VENDOR.json"), "utf-8"));

// ------------------------------------------------------------------ 1. the release, verified
const { loadReleaseData } = await import(pathToFileURL(join(vendorDir, "cardvision.js")).href);
const fileFetch = async (url) => {
  const path = fileURLToPath(url);
  if (!existsSync(path)) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
  const bytes = readFileSync(path);
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const digestSha256Hex = async (bytes) => createHash("sha256").update(Buffer.from(bytes)).digest("hex");
const releaseUrl = pathToFileURL(join(releaseDir, "release.json")).href;
const checked = await loadReleaseData(releaseUrl, { fetchFn: fileFetch, digestSha256Hex }, { ortWeb: vendor.onnxruntimeWeb });
if (!checked.ok) {
  console.error(`the release in ${releaseDir} did not pass the runtime's verification: ${checked.reason}`);
  process.exit(1);
}
const release = checked.data.release;
// A build fails without release-legal/, or when its NOTICE does not name this release.
const legalFiles = Object.fromEntries(
  LEGAL_FILES.filter((name) => existsSync(join(legalDir, name))).map((name) => [name, readFileSync(join(legalDir, name), "utf-8")]),
);
const legalProblem = releaseLegalProblem(release.id, legalFiles);
if (legalProblem) {
  console.error(legalProblem);
  process.exit(1);
}

// ------------------------------------------------------------------ 2. ONNX Runtime's files
const ortPkgDir = join(dirname(createRequire(import.meta.url).resolve("onnxruntime-web")), "..");
const ortVersion = JSON.parse(readFileSync(join(ortPkgDir, "package.json"), "utf-8")).version;
if (ortVersion !== vendor.onnxruntimeWeb) {
  console.error(`onnxruntime-web ${ortVersion} is installed; the vendored runtime is built on ${vendor.onnxruntimeWeb}. Run npm ci.`);
  process.exit(1);
}

// ------------------------------------------------------------------ 3. bundle
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "runtime"), { recursive: true });
mkdirSync(join(out, "release"), { recursive: true });
mkdirSync(join(out, "data"), { recursive: true });
/** src/config.ts imports kenbunshoku.config.json: give it the checked config, minus `$comment`. */
const configPlugin = {
  name: "fork-config",
  setup(b) {
    b.onLoad({ filter: /kenbunshoku\.config\.json$/ }, (args) => {
      // Only the checked config may reach the bundles: another file of that name is an error,
      // not a silent fallback to its unchecked contents.
      if (resolve(args.path) !== resolve(CONFIG_PATH)) throw new Error(`${args.path}: not the checked config (${CONFIG_PATH})`);
      const { $comment: _, ...rest } = config;
      return { contents: JSON.stringify(rest), loader: "json" };
    });
  },
};

const shared = {
  bundle: true,
  platform: "browser",
  target: "es2022",
  minify: !values.dev,
  sourcemap: false,
  logLevel: "warning",
  legalComments: "linked",
  define: { __DEV__: values.dev ? "true" : "false" },
  plugins: [configPlugin],
};
await build({ ...shared, format: "iife", entryPoints: { content: join(root, "src/content/index.ts") }, outdir: out });
await build({
  ...shared,
  format: "esm",
  entryPoints: {
    background: join(root, "src/background/index.ts"),
    compute: join(root, "src/compute/compute.ts"),
    tooltip: join(root, "src/tooltip/tooltip.ts"),
    popup: join(root, "src/popup/popup.ts"),
  },
  outdir: out,
});
// compute.js bundles the runtime's module; its license comments are in the runtime's LEGAL file.
copyFileSync(join(vendorDir, "cardvision.js.LEGAL.txt"), join(out, "cardvision.js.LEGAL.txt"));
for (const name of ["compute.html", "tooltip.html", "tooltip.css", "popup.css"]) copyFileSync(join(root, "static", name), join(out, name));
// The popup carries the extension's name from the config.
const escapeHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
writeFileSync(join(out, "popup.html"), readFileSync(join(root, "static", "popup.html"), "utf-8").replaceAll("{{name}}", escapeHtml(config.name)));

// The runtime's worker, and the one pair of ONNX Runtime files it loads, from beside it.
// OpenCV.js for the geometric stage sits beside the worker, which imports it from its own folder.
// (OpenCV.js only with the geometric stage, the one part that uses it.)
for (const name of ["worker.js", "worker.js.LEGAL.txt", ...(config.geometric ? ["opencv.mjs", "opencv_js.wasm", "opencv.mjs.LEGAL.txt"] : [])]) {
  copyFileSync(join(vendorDir, name), join(out, "runtime", name));
}
for (const name of vendor.ortFiles) copyFileSync(join(ortPkgDir, "dist", name), join(out, "runtime", name));

// ------------------------------------------------------------------ 4. the release and card data
const pinned = [release.detector.path, release.recognizer.path, release.bank.path, release.identity.groups.path, release.catalog.path];
copyFileSync(join(releaseDir, "release.json"), join(out, "release", "release.json"));
for (const name of LEGAL_FILES) copyFileSync(join(legalDir, name), join(out, "release", name));
for (const path of pinned) {
  mkdirSync(dirname(join(out, "release", path)), { recursive: true });
  copyFileSync(join(releaseDir, path), join(out, "release", path));
}
const catalog = JSON.parse(readFileSync(join(releaseDir, release.catalog.path), "utf-8"));
const table = buildCardTable(catalog, { printed: config.printedNumber === "catalog" });
writeFileSync(join(out, "data", "cards.json"), JSON.stringify(table));
// The {sourceFile} map: built from --images-index when given, else the committed copy
// (data/source-files.json, written by scripts/source-map.mjs).
let maps;
let mapFrom;
if (values["images-index"]) {
  const lines = readFileSync(resolve(values["images-index"]), "utf-8").split("\n").filter((l) => l.trim());
  maps = buildSourceFileMaps(catalog, lines.map((l) => JSON.parse(l))).maps;
  mapFrom = "--images-index";
} else {
  maps = JSON.parse(readFileSync(join(root, "data", "source-files.json"), "utf-8"));
  mapFrom = "data/source-files.json";
}
const mapSummary = `{sourceFile} map from ${mapFrom}: optcgapi ${Object.keys(maps.optcgapi ?? {}).length} of ${Object.keys(table).length} cards`;
writeFileSync(join(out, "data", "source-files.json"), JSON.stringify(maps));
// The geometric stage's settings file (it names the card-feature index on an image host), only
// when the config has the stage. A dev build may point it at a local copy of the index
// (--geo-manifest-url, for the smoke check).
if (config.geometric) {
  const geometric = JSON.parse(readFileSync(join(root, config.geometric.settings), "utf-8"));
  if (values["geo-manifest-url"]) geometric.index.path = values["geo-manifest-url"];
  else {
    const problem = geometricIndexProblem(geometric, config);
    if (problem) {
      console.error(`${config.geometric.settings}: ${problem}`);
      process.exit(1);
    }
  }
  writeFileSync(join(out, "data", "geometric.json"), `${JSON.stringify(geometric, null, 1)}\n`);
}

// ------------------------------------------------------------------ 5. manifest and notices
mkdirSync(join(out, "icons"), { recursive: true });
for (const size of ICON_SIZES) copyFileSync(join(root, config.icons, `icon-${size}.png`), join(out, "icons", `icon-${size}.png`));
const manifest = buildManifest({ version: pkg.version, dev: values.dev, store: values.store, config });
writeFileSync(join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
copyFileSync(join(root, "LICENSE"), join(out, "LICENSE"));
copyFileSync(join(root, "NOTICE"), join(out, "NOTICE"));
copyFileSync(join(root, "THIRD_PARTY_LICENSES.txt"), join(out, "THIRD_PARTY_LICENSES.txt"));
copyFileSync(join(vendorDir, "LICENSE"), join(out, "runtime", "LICENSE"));
copyFileSync(join(vendorDir, "NOTICE"), join(out, "runtime", "NOTICE"));

let commit = "unknown";
try {
  commit = execFileSync("git", ["-C", root, "rev-parse", "--short", "HEAD"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {}
const kb = (p) => `${(statSync(join(out, p)).size / 1024).toFixed(0)} KB`;
console.log(`dist/ ${values.dev ? "(dev build) " : values.store ? "(Web Store build, no key) " : "(unpacked build, fixed ID) "}${config.name} ${pkg.version} at ${commit}`);
console.log(`  release ${release.id} (${release.game}, ${release.bank.cardCount} cards in the bank), verified by the runtime`);
console.log(`  runtime ${vendor.package} ${vendor.version} at ${vendor.commit.slice(0, 7)}, onnxruntime-web ${ortVersion}`);
console.log(`  content.js ${kb("content.js")}, compute.js ${kb("compute.js")}, tooltip.js ${kb("tooltip.js")}, runtime/worker.js ${kb("runtime/worker.js")}`);
console.log(`  ${mapSummary}`);
