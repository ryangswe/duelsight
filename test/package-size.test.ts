// SPDX-License-Identifier: Apache-2.0
// scripts/package-size.mjs: text files near addons.mozilla.org's 5 MiB parse limit. Made-up files only.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { AMO_PARSE_LIMIT, oversizedTextFiles, TEXT_FILE_LIMIT } from "../scripts/package-size.mjs";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function dist(files: Record<string, number>): string {
  const dir = mkdtempSync(join(tmpdir(), "ds-size-"));
  dirs.push(dir);
  for (const [path, bytes] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), Buffer.alloc(bytes, 0x20));
  }
  return dir;
}

describe("oversizedTextFiles", () => {
  it("holds packages to 4.5 MiB, half a MiB under the 5 MiB the store refuses", () => {
    expect(TEXT_FILE_LIMIT).toBe(4.5 * 1024 * 1024);
    expect(AMO_PARSE_LIMIT - TEXT_FILE_LIMIT).toBe(512 * 1024);
  });

  it("lists every parsed text type at or over the limit, largest first, and nothing else", () => {
    const dir = dist({
      "release/catalog.json": TEXT_FILE_LIMIT,
      "release/bank.json": TEXT_FILE_LIMIT + 10,
      "compute.js": TEXT_FILE_LIMIT - 1,
      "runtime/x.mjs": TEXT_FILE_LIMIT + 1,
      "popup.css": 10,
      "release/bank.bin": TEXT_FILE_LIMIT * 2,
      "release/recognizer.onnx": TEXT_FILE_LIMIT * 2,
      "runtime/ort.wasm": TEXT_FILE_LIMIT * 2,
    });
    expect(oversizedTextFiles(dir)).toEqual([
      { path: join("release", "bank.json"), bytes: TEXT_FILE_LIMIT + 10 },
      { path: join("runtime", "x.mjs"), bytes: TEXT_FILE_LIMIT + 1 },
      { path: join("release", "catalog.json"), bytes: TEXT_FILE_LIMIT },
    ]);
  });

  it("passes a package of small files", () => {
    expect(oversizedTextFiles(dist({ "manifest.json": 900, "tooltip.html": 2000 }))).toEqual([]);
  });
});
