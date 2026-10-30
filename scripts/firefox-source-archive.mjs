// SPDX-License-Identifier: Apache-2.0
// The source archive addons.mozilla.org asks for with a Firefox upload (its reviewers rebuild
// minified code from source). It is for the reviewers only: never publish it.
//
//   node scripts/firefox-source-archive.mjs --release <release folder> --runtime-repo <toolkit checkout> [--out <zip>]
//
// Run it on the commit the Firefox package was built from; it refuses uncommitted changes to
// tracked files. It writes <packageName>-<version>-firefox-source.zip holding:
//   duelsight/            this repository at HEAD (git archive)
//   cardvision-browser/   the vendored runtime's source: the toolkit's browser/ folder, LICENSE
//                         and NOTICE at the commit vendor/cardvision-browser/VENDOR.json records
//   release/<id>/         the release the package bundles (models and card data: data, not code)
//   README.md             what reviewers need: requirements, steps, what is third-party
//   build-firefox.sh      the steps, as one script: it rebuilds the runtime, checks it against
//                         the vendored copy, builds the add-on and writes out/<package>.zip
// It uploads nothing.

import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { loadForkConfig } from "./fork-config.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const { values } = parseArgs({
  options: {
    release: { type: "string" },
    "runtime-repo": { type: "string" },
    out: { type: "string" },
  },
});
if (!values.release || !values["runtime-repo"]) {
  console.error("usage: node scripts/firefox-source-archive.mjs --release <release folder> --runtime-repo <toolkit checkout> [--out <zip>]");
  process.exit(2);
}
const config = loadForkConfig();
if (typeof config.firefoxAddonId !== "string") {
  console.error("duelsight.config.json has no firefoxAddonId: there is no Firefox build");
  process.exit(1);
}
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf-8" }).trim();
const dirty = git(root, "status", "--porcelain", "--untracked-files=no");
if (dirty) {
  console.error(`uncommitted changes; reviewers rebuild from one commit, so commit first:\n${dirty}`);
  process.exit(1);
}
const commit = git(root, "rev-parse", "HEAD");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")).version;
const vendor = JSON.parse(readFileSync(join(root, "vendor", "cardvision-browser", "VENDOR.json"), "utf-8"));
const runtimeRepo = resolve(values["runtime-repo"]);
try {
  git(runtimeRepo, "cat-file", "-e", `${vendor.commit}^{commit}`);
} catch {
  console.error(`${runtimeRepo} does not have the runtime's commit ${vendor.commit} (vendor/cardvision-browser/VENDOR.json)`);
  process.exit(1);
}
const releaseDir = resolve(values.release);
const release = JSON.parse(readFileSync(join(releaseDir, "release.json"), "utf-8"));
const pinned = [release.detector.path, release.recognizer.path, release.bank.path, release.identity.groups.path, release.catalog.path];
const packageZip = `${config.packageName}-${version}-firefox.zip`;
const outZip = resolve(values.out ?? join(root, `${config.packageName}-${version}-firefox-source.zip`));

const work = mkdtempSync(join(tmpdir(), "ff-source-"));
try {
  const top = join(work, "source");
  mkdirSync(top);
  const untar = (cwd, ...args) => {
    const tar = execFileSync("git", ["-C", cwd, "archive", "--format=tar", ...args], { maxBuffer: 1 << 30 });
    return tar;
  };
  for (const [dir, tar] of [
    ["duelsight", untar(root, "HEAD")],
    ["cardvision-browser", untar(runtimeRepo, vendor.commit, "browser", "LICENSE", "NOTICE")],
  ]) {
    mkdirSync(join(top, dir));
    execFileSync("tar", ["-x", "-C", join(top, dir)], { input: tar });
  }
  const rel = join(top, "release", release.id);
  mkdirSync(rel, { recursive: true });
  for (const path of ["release.json", ...pinned]) {
    if (!existsSync(join(releaseDir, path))) throw new Error(`${releaseDir}: ${path} is missing`);
    mkdirSync(dirname(join(rel, path)), { recursive: true });
    copyFileSync(join(releaseDir, path), join(rel, path));
  }
  writeFileSync(join(top, "build-firefox.sh"), buildScript({ releaseId: release.id, packageZip }));
  chmodSync(join(top, "build-firefox.sh"), 0o755);
  writeFileSync(join(top, "README.md"), readme({ commit, version, vendor, releaseId: release.id, packageZip }));
  rmSync(outZip, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", outZip, "."], { cwd: top, stdio: "inherit" });
} finally {
  rmSync(work, { recursive: true, force: true });
}
console.log(`wrote ${outZip}`);
console.log(`  ${config.name} ${version} at ${commit.slice(0, 7)}; runtime source at ${vendor.commit.slice(0, 7)}; release ${release.id}`);
console.log("  check it: unzip it into an empty folder, run ./build-firefox.sh, and compare out/ with the package you upload");

function buildScript({ releaseId, packageZip }) {
  return `#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Rebuild the Firefox add-on from this archive. Needs Node 22 or later, npm, zip and cmp.
set -eu
here=$(cd "$(dirname "$0")" && pwd)

echo "1/3 the recognition runtime (cardvision-browser), from source"
cd "$here/cardvision-browser/browser"
npm ci
npm run build
for f in cardvision.js worker.js remote-release.js compute-session.js page-capture.js node/verify-release.mjs node/package-zip.mjs; do
  cmp "dist/$f" "$here/duelsight/vendor/cardvision-browser/$f"
done
echo "    dist/cardvision.js, worker.js, remote-release.js, compute-session.js, page-capture.js and node/*.mjs are byte for byte the vendored copies"

echo "2/3 the add-on"
cd "$here/duelsight"
npm ci
npm run build -- --target firefox --release "$here/release/${releaseId}"
npm run package

echo "3/3 the package"
mkdir -p "$here/out"
mv "$here/duelsight/${packageZip}" "$here/out/${packageZip}"
echo "    $here/out/${packageZip}"
`;
}

function readme({ commit, version, vendor, releaseId, packageZip }) {
  return `# ${config.name} ${version} for Firefox: source for review

This archive rebuilds \`${packageZip}\`, the package uploaded to addons.mozilla.org.

## Requirements

- macOS or Linux (any POSIX shell), with \`zip\`, \`unzip\` and \`cmp\`.
- Node.js 22 or later, with npm (tested with Node 24). Everything else comes from npm, pinned
  by each folder's \`package-lock.json\`.

## Build

\`\`\`
./build-firefox.sh
\`\`\`

It does three things:

1. Builds the recognition runtime from \`cardvision-browser/browser/\` (\`npm ci && npm run build\`)
   and checks that \`dist/cardvision.js\`, \`dist/worker.js\`, \`dist/remote-release.js\`,
   \`dist/compute-session.js\` and \`dist/page-capture.js\` are byte for byte the copies in
   \`duelsight/vendor/cardvision-browser/\` that the add-on bundles, and \`dist/node/package-zip.mjs\`
   the copy step 2 zips the package with. The build prints that
   OpenCV.js was not copied: the add-on does not use it.
2. Builds the add-on from \`duelsight/\` (\`npm ci\`, then
   \`npm run build -- --target firefox --release ../release/${releaseId}\` and \`npm run package\`).
3. Moves the package to \`out/${packageZip}\`. Unzipped, it matches the uploaded package file
   for file.

## What is in the package, and where it comes from

| In the package | From |
| --- | --- |
| \`background.js\`, \`content.js\`, \`compute.js\`, \`tooltip.js\`, \`popup.js\` | \`duelsight/src/\` (TypeScript), bundled and minified by esbuild (\`duelsight/scripts/build.mjs\`). \`compute.js\` includes the runtime's \`compute-session.js\` and \`remote-release.js\`, and \`content.js\` its \`page-capture.js\`. |
| \`runtime/worker.js\` | the runtime's worker, built from \`cardvision-browser/browser/src/\` by esbuild (step 1). It includes ONNX Runtime Web's JavaScript. |
| \`runtime/ort-wasm-simd-threaded.jsep.mjs\`, \`.wasm\` | ONNX Runtime Web ${vendor.onnxruntimeWeb} from npm (\`onnxruntime-web\`), unmodified. |
| \`release/\` | the recognition release ${releaseId}: two ONNX models and JSON card data (a card list and reference vectors). Data, not code. |
| \`data/cards.json\` | card names, made from the release's card list at build time. |
| \`*.html\`, \`*.css\`, \`icons/\` | \`duelsight/static/\` and \`duelsight/icons/\`, copied. |

The add-on runs no remote code. It downloads data only from its own CDN: a settings file, card
pictures, a card details file and, when one is published, a newer release of the same kind (JSON
and ONNX data, checked against SHA-256 pins). Every script and the WebAssembly are in the package.

## Versions

- ${config.name}: commit \`${commit}\`.
- cardvision-browser (the runtime, Apache-2.0): commit \`${vendor.commit}\` (${vendor.toolkitRelease ?? "the toolkit"}).
`;
}
