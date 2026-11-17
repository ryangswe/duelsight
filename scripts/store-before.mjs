// SPDX-License-Identifier: Apache-2.0
// The release file's `before` addresses as warnings, for store-check.yml on a version pull request.
//
//   node scripts/store-before.mjs --release store/releases/<version>.json --out <file> [--released]
//
// `before` lists what must be live before the stores get the packages, such as this version's
// privacy page. On the version pull request it is not live yet by design: the owner publishes it
// after the merge. So the pull request's check warns instead of failing. The guard itself stays
// where it matters: store-release.yml's build job checks the full release file on the tag, and
// its upload job refuses to upload while an address is not live.
//
// It writes the release file without `before` to --out, which must be in the same folder as the
// release file (the release file names its notes relative to that folder), then fetches each
// address as `store-upload.mjs check` does (HTTP 200, and the sha256 when the entry gives one). Each
// problem is printed as a GitHub warning and added to the job summary ($GITHUB_STEP_SUMMARY).
// It exits 0 whether or not the addresses are live. With --released (the version is already
// released, so this pull request is not that release) it fetches nothing, and --out keeps only the
// version: the release's notes, store settings and addresses describe that release.

import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

/** The release file without `before`, and the `before` list on its own. */
export function splitBefore(release) {
  const { before = [], ...rest } = release;
  return { release: rest, before };
}

/** Why each address is not ready, as `store-upload.mjs check` would say it. */
export async function beforeProblems(before, fetchFn = fetch) {
  const out = [];
  for (const b of before) {
    const why = b.why ? ` (${b.why})` : "";
    try {
      const res = await fetchFn(b.url, { method: "GET", cache: "no-store" });
      if (res.status !== 200) {
        out.push(`${b.url}: HTTP ${res.status}${why}`);
        continue;
      }
      if (b.sha256) {
        const got = createHash("sha256").update(new Uint8Array(await res.arrayBuffer())).digest("hex");
        if (got !== b.sha256) out.push(`${b.url}: sha256 ${got.slice(0, 16)}… is not ${b.sha256.slice(0, 16)}…${why}`);
      }
    } catch (error) {
      out.push(`${b.url}: ${error instanceof Error ? error.message : String(error)}${why}`);
    }
  }
  return out;
}

/** A GitHub workflow command's message: %, CR and LF escaped. */
export function workflowMessage(text) {
  return text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

async function main() {
  const { values } = parseArgs({
    options: { release: { type: "string" }, out: { type: "string" }, released: { type: "boolean", default: false } },
  });
  if (!values.release || !values.out) throw new Error("usage: store-before.mjs --release <release file> --out <file>");
  if (dirname(resolve(values.out)) !== dirname(resolve(values.release))) {
    throw new Error(`--out must be in ${dirname(values.release)}, beside the release file`);
  }
  if (resolve(values.out) === resolve(values.release)) throw new Error("--out must not be the release file");
  const { release, before } = splitBefore(JSON.parse(readFileSync(values.release, "utf-8")));
  // A released version's file describes that release, not this pull request: only its version is
  // kept, which the packages are checked against.
  const kept = values.released ? { version: release.version } : release;
  writeFileSync(values.out, `${JSON.stringify(kept, null, 2)}\n`);
  if (values.released) {
    console.log(`${before.length} before address(es), not fetched (${release.version} is released)`);
    return;
  }
  const problems = await beforeProblems(before);
  const summary = [];
  if (before.length > 0) {
    summary.push("", "### Before upload", "");
    summary.push(problems.length === 0
      ? `All ${before.length} address(es) are live.`
      : "Not live yet. Publish these before pushing the tag; the upload refuses until they are:");
    for (const p of problems) {
      console.log(`::warning title=Not live yet (before upload)::${workflowMessage(p)}`);
      summary.push(`- ${p}`);
    }
  }
  console.log(before.length === 0 ? "no before addresses" : `${before.length} before address(es), ${problems.length} not live`);
  if (process.env.GITHUB_STEP_SUMMARY && summary.length > 0) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary.join("\n")}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
