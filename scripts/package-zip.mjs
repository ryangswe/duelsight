// SPDX-License-Identifier: Apache-2.0
// The zip `npm run package` writes, and its layout. Two kinds:
//   - a release-page zip (the manifest carries the key): <packageName>-<version>.zip holding one
//     folder of the same name, which is what a user selects in Chrome's "Load unpacked";
//   - a Chrome Web Store zip (no key, built with --store): <packageName>-<version>-store.zip with
//     manifest.json and every other file at the top level, as the store requires.

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The zip's file name and the folder its files sit in (null: at the top level). */
export function zipLayout(packageName, manifest) {
  const store = !manifest.key;
  const base = `${packageName}-${manifest.version}`;
  return store ? { file: `${base}-store.zip`, folder: null, store } : { file: `${base}.zip`, folder: base, store };
}

/** Zip the folder `dist` into `zipPath` with the layout's folder (or none). Replaces an older zip. */
export function writeZip(dist, zipPath, folder) {
  const work = mkdtempSync(join(tmpdir(), "package-"));
  try {
    const top = join(work, folder ?? "package");
    cpSync(dist, top, { recursive: true });
    rmSync(zipPath, { force: true });
    if (folder) execFileSync("zip", ["-r", "-X", "-q", zipPath, folder], { cwd: work, stdio: "inherit" });
    else execFileSync("zip", ["-r", "-X", "-q", zipPath, "."], { cwd: top, stdio: "inherit" });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
