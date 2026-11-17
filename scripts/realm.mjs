// SPDX-License-Identifier: Apache-2.0
// The toolkit's realm check on a built extension (vendor/cardvision-browser/node/realm-check.mjs):
// each realm (the content script, the compute frame, the tooltip, the popup, the background and the
// recognition worker) holds one copy of the toolkit's runtime. It fails when a built file holds one
// of the runtime's realm marks twice, which is a module bundled twice. npm run build runs it once
// every file is written, and npm run package runs it again before zipping, since a build that
// failed leaves its files.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const REALM_CHECK = fileURLToPath(new URL("../vendor/cardvision-browser/node/realm-check.mjs", import.meta.url));

/** Runs the vendored check on `dir`: its exit code (0 clean, 1 a mark twice, 2 a bad argument, an
 *  unreadable file or nothing to check; also 2, with the reason, when the check could not start or
 *  was stopped by a signal) and what it printed. */
export function realmCheck(dir) {
  const run = spawnSync(process.execPath, [REALM_CHECK, dir], { encoding: "utf-8" });
  const printed = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim();
  if (run.error) return { status: 2, output: `realm check could not run: ${run.error.message}` };
  if (run.status === null) return { status: 2, output: `realm check stopped by ${run.signal}${printed ? `\n${printed}` : ""}` };
  return { status: run.status, output: printed };
}
