// SPDX-License-Identifier: Apache-2.0
// scripts/realm.mjs runs the vendored realm check (node/realm-check.mjs), which npm run build and
// npm run package use to refuse a built file holding the toolkit's runtime twice. Made-up folders
// only; the mark texts are read from the vendored check, so a toolkit change to them is followed.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { REALM_CHECK, realmCheck } from "../scripts/realm.mjs";

/** The texts of the realm marks, as the vendored check encodes them (`mark(id, module, base64)`). */
const MARKS = [...readFileSync(REALM_CHECK, "utf-8").matchAll(/mark\("[^"]+", "[^"]+", "([A-Za-z0-9+/=]+)"\)/g)].map((m) =>
  Buffer.from(m[1]!, "base64").toString("utf-8"),
);

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function built(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "ds-realm-"));
  dirs.push(dir);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

const holding = (...texts: string[]) => texts.map((t) => `throw new Error(${JSON.stringify(t)});`).join("\n");

describe("realmCheck", () => {
  it("reads the vendored check's marks", () => {
    expect(MARKS.length).toBeGreaterThanOrEqual(3);
    for (const text of MARKS) expect(text.length).toBeGreaterThan(10);
  });

  // popup.html holds a mark twice and passes: the check reads only .js and .mjs files.
  it("passes a build where each file holds each mark at most once", () => {
    const [a, b] = MARKS as [string, string];
    const result = realmCheck(built({ "content.js": holding(a, b), "compute.js": holding(a), "runtime/worker.js": holding(b), "popup.html": holding(a, a) }));
    expect(result.status).toBe(0);
    expect(result.output).toMatch(/realm check: 3 files, no realm mark twice/);
  });

  it("fails a file that holds a mark twice", () => {
    const [a] = MARKS as [string];
    const result = realmCheck(built({ "content.js": holding(a, a), "compute.js": holding(a) }));
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/content\.js: the realm mark .* occurs 2 times/);
  });

  it("fails a doubled file in a subfolder", () => {
    const [, b] = MARKS as [string, string];
    const result = realmCheck(built({ "content.js": holding(b), "runtime/worker.mjs": holding(b, b) }));
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/runtime[\\/]worker\.mjs: the realm mark/);
  });

  it("fails a folder with nothing to check", () => {
    const result = realmCheck(built({ "manifest.json": "{}", "popup.html": "<p></p>" }));
    expect(result.status).toBe(2);
    expect(result.output).toMatch(/nothing was read/);
  });
});
