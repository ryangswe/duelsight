// SPDX-License-Identifier: Apache-2.0
// Zip the built extension for a release: <packageName>-<version>.zip (packageName from
// kenbunshoku.config.json), holding one folder of the same name, which is what a user selects
// in Chrome's "Load unpacked".
//
//   npm run build -- --release <release folder> --images-index <images.jsonl>
//   npm run package
//
// It refuses a dev build. It uploads nothing: publishing the zip is a person's decision.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadForkConfig } from "./fork-config.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
if (!existsSync(join(dist, "manifest.json"))) {
  console.error("no dist/manifest.json: run npm run build -- --release <folder> first");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf-8"));
const config = loadForkConfig();
if (manifest.name !== config.name) {
  console.error(`dist/ is a "${manifest.name}" build; package a release build (no --dev)`);
  process.exit(1);
}
// A zip for a release page is loaded unpacked and carries the key; a Web Store build has none.
const name = manifest.key ? `${config.packageName}-${manifest.version}` : `${config.packageName}-${manifest.version}-store`;
const zip = join(root, `${name}.zip`);
const work = mkdtempSync(join(tmpdir(), `${config.packageName}-package-`));
try {
  cpSync(dist, join(work, name), { recursive: true });
  rmSync(zip, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", zip, name], { cwd: work, stdio: "inherit" });
} finally {
  rmSync(work, { recursive: true, force: true });
}
console.log(`wrote ${name}.zip`);
