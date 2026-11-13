// SPDX-License-Identifier: Apache-2.0
// The card release DuelSight bundles, from the release page that scripts/release-source.json names.
//
//   node scripts/fetch-release.mjs --into <folder> [--github-env]
//
// Downloads the release zip (three tries), checks its SHA-256, unpacks its release/ folder into
// <folder> and checks that release.json has the pinned id. It prints the release folder's path;
// with --github-env it also appends RELEASE_DIR=<path> to $GITHUB_ENV. Needs `unzip`.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export const RELEASE_SOURCE = fileURLToPath(new URL("release-source.json", import.meta.url));

export function readReleaseSource(path = RELEASE_SOURCE) {
  const source = JSON.parse(readFileSync(path, "utf-8"));
  for (const key of ["id", "zipUrl", "zipSha256", "zipFolder"]) {
    if (typeof source[key] !== "string" || source[key] === "") throw new Error(`${path}: ${key} is missing`);
  }
  if (!/^[0-9a-f]{16}$/.test(source.id)) throw new Error(`${path}: id is not 16 hex digits`);
  if (!/^[0-9a-f]{64}$/.test(source.zipSha256)) throw new Error(`${path}: zipSha256 is not 64 hex digits`);
  if (!source.zipUrl.startsWith("https://")) throw new Error(`${path}: zipUrl is not https`);
  if (!/^[A-Za-z0-9._-]+$/.test(source.zipFolder)) throw new Error(`${path}: zipFolder is not a plain folder name`);
  return source;
}

async function download(url) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      last = error;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error(`${url}: ${last?.message ?? last}`);
}

/** Downloads, checks and unpacks the pinned release into `into`; returns the release folder. */
export async function fetchRelease(into, source = readReleaseSource()) {
  const dir = resolve(into);
  mkdirSync(dir, { recursive: true });
  const bytes = await download(source.zipUrl);
  const got = createHash("sha256").update(bytes).digest("hex");
  if (got !== source.zipSha256) throw new Error(`${source.zipUrl}: sha256 ${got}, expected ${source.zipSha256}`);
  const zip = join(dir, "release-source.zip");
  writeFileSync(zip, bytes);
  execFileSync("unzip", ["-q", "-o", zip, `${source.zipFolder}/release/*`, "-d", dir], { stdio: "inherit" });
  const releaseDir = join(dir, source.zipFolder, "release");
  const release = JSON.parse(readFileSync(join(releaseDir, "release.json"), "utf-8"));
  if (release.id !== source.id) throw new Error(`release ${release.id}, expected ${source.id}`);
  return releaseDir;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { into: { type: "string" }, "github-env": { type: "boolean" } } });
  if (!values.into) {
    console.error("usage: node scripts/fetch-release.mjs --into <folder> [--github-env]");
    process.exit(2);
  }
  try {
    const releaseDir = await fetchRelease(values.into);
    if (values["github-env"]) {
      if (!process.env.GITHUB_ENV) throw new Error("--github-env: GITHUB_ENV is not set");
      appendFileSync(process.env.GITHUB_ENV, `RELEASE_DIR=${releaseDir}\n`);
    }
    console.log(releaseDir);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
