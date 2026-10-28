// SPDX-License-Identifier: Apache-2.0
// The vendored node/package-zip.mjs: the zip `npm run package` writes. A Chrome Web Store build has
// manifest.json at the zip's top level (the store refuses a zip that nests it); a release-page
// build keeps one folder for Chrome's "Load unpacked". Made-up files only.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

// @ts-expect-error the vendored Node tool has no declarations
import { writeZip, zipLayout } from "../vendor/cardvision-browser/node/package-zip.mjs";

type Layout = { file: string; folder: string | null; store: boolean };

function hasTool(name: string): boolean {
  try {
    execFileSync("which", [name], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const ZIP_TOOLS = hasTool("zip") && hasTool("unzip");

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A made-up dist/: a manifest, a script and one nested file. */
function fakeDist(manifest: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), "ds-dist-"));
  dirs.push(dir);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest));
  writeFileSync(join(dir, "content.js"), "// content\n");
  mkdirSync(join(dir, "release"));
  writeFileSync(join(dir, "release", "release.json"), "{}\n");
  return dir;
}

function entries(zipPath: string): string[] {
  return execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf-8" }).split("\n").filter(Boolean).sort();
}

describe("zipLayout", () => {
  it("names a Web Store build's zip -store and puts its files at the top level", () => {
    const layout: Layout = zipLayout("duelsight", { version: "0.1.0" });
    expect(layout).toEqual({ file: "duelsight-0.1.0-store.zip", folder: null, store: true });
  });

  it("names a Firefox build's zip -firefox and puts its files at the top level", () => {
    const layout = zipLayout("duelsight", { version: "0.3.0", browser_specific_settings: { gecko: { id: "duelsight@duelsight.com" } } });
    expect(layout).toEqual({ file: "duelsight-0.3.0-firefox.zip", folder: null, store: true, firefox: true });
  });

  it("keeps a release-page build in one folder named like the zip", () => {
    const layout: Layout = zipLayout("duelsight", { version: "0.2.0", key: "MIIB…" });
    expect(layout).toEqual({ file: "duelsight-0.2.0.zip", folder: "duelsight-0.2.0", store: false });
  });
});

describe.skipIf(!ZIP_TOOLS)("writeZip", () => {
  it("writes a Web Store zip with manifest.json at the top level", () => {
    const dist = fakeDist({ name: "DuelSight", version: "0.1.0" });
    const out = mkdtempSync(join(tmpdir(), "ds-zip-"));
    dirs.push(out);
    const layout: Layout = zipLayout("duelsight", { version: "0.1.0" });
    writeZip(dist, join(out, layout.file), layout.folder);
    const files = entries(join(out, layout.file));
    expect(files).toContain("manifest.json");
    expect(files).toContain("release/release.json");
    expect(files.filter((f) => !f.endsWith("/")).every((f) => !f.startsWith("duelsight-"))).toBe(true);
    const manifest = execFileSync("unzip", ["-p", join(out, layout.file), "manifest.json"], { encoding: "utf-8" });
    expect(JSON.parse(manifest)).toEqual({ name: "DuelSight", version: "0.1.0" });
  });

  it("writes a release-page zip with every file inside its one folder", () => {
    const dist = fakeDist({ name: "DuelSight", version: "0.2.0", key: "MIIB…" });
    const out = mkdtempSync(join(tmpdir(), "ds-zip-"));
    dirs.push(out);
    const layout: Layout = zipLayout("duelsight", { version: "0.2.0", key: "MIIB…" });
    writeZip(dist, join(out, layout.file), layout.folder);
    const files = entries(join(out, layout.file)).filter((f) => !f.endsWith("/"));
    expect(files).toEqual(["duelsight-0.2.0/content.js", "duelsight-0.2.0/manifest.json", "duelsight-0.2.0/release/release.json"]);
  });

  it("replaces an older zip of the same name instead of adding to it", () => {
    const out = mkdtempSync(join(tmpdir(), "ds-zip-"));
    dirs.push(out);
    const zipPath = join(out, "duelsight-0.1.0-store.zip");
    const first = fakeDist({ name: "DuelSight", version: "0.1.0" });
    writeFileSync(join(first, "old.js"), "// only in the first build\n");
    writeZip(first, zipPath, null);
    writeZip(fakeDist({ name: "DuelSight", version: "0.1.0" }), zipPath, null);
    expect(entries(zipPath)).not.toContain("old.js");
    expect(readFileSync(zipPath).length).toBeGreaterThan(0);
  });
});
