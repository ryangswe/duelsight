// SPDX-License-Identifier: Apache-2.0
// addons.mozilla.org's linter refuses an add-on holding a text file of 5 MiB or more (it does not
// parse it: FILE_TOO_LARGE is an error, and an upload with an error is refused). The card catalog
// grows with every set, so a package is refused well before that: at 4.5 MiB, a few sets early.
// One codebase ships to both stores, so the Chrome package is held to it too.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** The file types the linter parses (the rest it treats as binary and does not size-check). */
export const PARSED_TEXT = /\.(json|js|mjs|jsm|css|html|htm)$/i;
export const AMO_PARSE_LIMIT = 5 * 1024 * 1024;
export const TEXT_FILE_LIMIT = 4.5 * 1024 * 1024;

/** Text files in `dir` (recursively) at or over `limit` bytes: [{ path, bytes }], largest first. */
export function oversizedTextFiles(dir, limit = TEXT_FILE_LIMIT) {
  const out = [];
  for (const rel of readdirSync(dir, { recursive: true })) {
    const path = String(rel);
    if (!PARSED_TEXT.test(path)) continue;
    const st = statSync(join(dir, path));
    if (st.isFile() && st.size >= limit) out.push({ path, bytes: st.size });
  }
  return out.sort((a, b) => b.bytes - a.bytes);
}

export function describeOversized(files) {
  const mib = (n) => (n / 1024 / 1024).toFixed(2);
  return files.map((f) => `${f.path} ${mib(f.bytes)} MiB`).join(", ");
}
