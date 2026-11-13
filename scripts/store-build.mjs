// SPDX-License-Identifier: Apache-2.0
// The store packages of this commit, for the store workflows (.github/workflows/store-release.yml
// and store-check.yml) and for a release by hand.
//
//   npm run store:build [-- --release <release folder>] [--runtime-repo <toolkit checkout>]
//
// It writes, in out/:
//   chrome.zip           the Chrome Web Store package (npm run build -- --store, npm run package)
//   firefox.zip          the addons.mozilla.org package (--target firefox)
//   firefox-source.zip   the source archive for Mozilla's reviewers (scripts/firefox-source-archive.mjs)
//
// Before building, it checks the card release against this version's row in cdn/RUNTIMES.json
// (its id and the two models' SHA-256) and the vendored runtime against the same row (the
// toolkit commit and ONNX Runtime Web version). The release comes from the release page that
// scripts/release-source.json names, unless --release gives a folder (which must be the same
// release). The source archive needs the toolkit at the vendored commit: --runtime-repo, or a
// shallow fetch of that one commit from the toolkit's public repository.
//
// After building, it runs the source round trip: it unzips firefox-source.zip into an empty
// folder, runs its build-firefox.sh and checks that the package it makes holds the same files,
// byte for byte, as firefox.zip. It prints each package's payload hash (the SHA-256 over the
// sorted list of per-file SHA-256 lines, as the release records give it).

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { fetchRelease, readReleaseSource } from "./fetch-release.mjs";
import { loadForkConfig } from "./fork-config.mjs";

const TOOLKIT_REPO = "https://github.com/ryangswe/riftsight-vision.git";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "out");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, stdio: "inherit" });
const step = (text) => console.log(`\n== ${text}`);

function filesUnder(dir) {
  const list = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name !== ".DS_Store") list.push(relative(dir, p).split("\\").join("/"));
    }
  };
  walk(dir);
  return list.sort();
}

/** The payload hash of an unpacked package folder: sha256 over "<sha256>  ./<path>" lines in path order. */
export function payloadHash(dir) {
  const lines = filesUnder(dir).map((p) => `${sha256(readFileSync(join(dir, p)))}  ./${p}\n`);
  return sha256(lines.join(""));
}

function unzipTo(zip, dir) {
  mkdirSync(dir, { recursive: true });
  execFileSync("unzip", ["-q", "-o", zip, "-d", dir]);
  return dir;
}

function sameFiles(a, b) {
  const la = filesUnder(a);
  const lb = filesUnder(b);
  const problems = [];
  for (const p of la) if (!lb.includes(p)) problems.push(`only in the uploaded package: ${p}`);
  for (const p of lb) if (!la.includes(p)) problems.push(`only in the rebuilt package: ${p}`);
  for (const p of la) {
    if (lb.includes(p) && !readFileSync(join(a, p)).equals(readFileSync(join(b, p)))) problems.push(`differs: ${p}`);
  }
  return { problems, count: la.length };
}

function checkRuntimesRow({ version, releaseDir, vendor }) {
  const runtimes = JSON.parse(readFileSync(join(root, "cdn", "RUNTIMES.json"), "utf-8"));
  const row = runtimes[version];
  if (!row) throw new Error(`cdn/RUNTIMES.json has no row for ${version}`);
  const release = JSON.parse(readFileSync(join(releaseDir, "release.json"), "utf-8"));
  const problems = [];
  if (row.vendoredCommit !== vendor.toolkit.commit) {
    problems.push(`vendoredCommit ${row.vendoredCommit} is not the vendored toolkit's ${vendor.toolkit.commit}`);
  }
  if (row.ortWeb !== vendor.ort.version) problems.push(`ortWeb ${row.ortWeb} is not the vendored ${vendor.ort.version}`);
  const bundled = row.bundledRelease ?? {};
  if (bundled.id !== release.id) problems.push(`bundledRelease.id ${bundled.id} is not the release's ${release.id}`);
  for (const [key, entry] of [["detectorSha256", release.detector], ["recognizerSha256", release.recognizer]]) {
    const got = sha256(readFileSync(join(releaseDir, entry.path)));
    if (bundled[key] !== got) problems.push(`bundledRelease.${key} ${bundled[key]} is not ${entry.path}'s ${got}`);
  }
  if (problems.length > 0) throw new Error(`cdn/RUNTIMES.json, row ${version}:\n  ${problems.join("\n  ")}`);
  return release.id;
}

function toolkitCheckout(commit, work) {
  const dir = join(work, "toolkit");
  mkdirSync(dir);
  const git = (...args) => execFileSync("git", ["-C", dir, ...args], { stdio: ["ignore", "ignore", "inherit"] });
  git("init", "-q");
  git("fetch", "-q", "--depth", "1", TOOLKIT_REPO, commit);
  return dir;
}

async function main() {
  const { values } = parseArgs({
    options: { release: { type: "string" }, "runtime-repo": { type: "string" } },
  });
  const config = loadForkConfig();
  const version = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")).version;
  const vendor = JSON.parse(readFileSync(join(root, "vendor", "cardvision-browser", "cardvision-vendor.json"), "utf-8"));
  const source = readReleaseSource();
  const work = mkdtempSync(join(tmpdir(), "store-build-"));
  try {
    step("The card release");
    const releaseDir = values.release ? resolve(values.release) : await fetchRelease(join(work, "release-source"), source);
    const releaseId = checkRuntimesRow({ version, releaseDir, vendor });
    if (releaseId !== source.id) throw new Error(`the release is ${releaseId}; scripts/release-source.json pins ${source.id}`);
    console.log(`release ${releaseId} matches cdn/RUNTIMES.json row ${version} (toolkit ${vendor.toolkit.commit.slice(0, 7)}, ONNX Runtime Web ${vendor.ort.version})`);

    rmSync(out, { recursive: true, force: true });
    mkdirSync(out);
    const builds = [
      ["chrome.zip", ["--store"], `${config.packageName}-${version}-store.zip`],
      ["firefox.zip", ["--target", "firefox"], `${config.packageName}-${version}-firefox.zip`],
    ];
    for (const [name, flags, made] of builds) {
      step(`out/${name}`);
      run("node", ["scripts/build.mjs", ...flags, "--release", releaseDir]);
      run("node", ["scripts/package.mjs"]);
      copyFileSync(join(root, made), join(out, name));
      rmSync(join(root, made));
    }

    step("out/firefox-source.zip");
    const runtimeRepo = values["runtime-repo"] ? resolve(values["runtime-repo"]) : toolkitCheckout(vendor.toolkit.commit, work);
    run("node", [
      "scripts/firefox-source-archive.mjs", "--release", releaseDir, "--runtime-repo", runtimeRepo,
      "--out", join(out, "firefox-source.zip"),
    ]);

    step("The source round trip: build-firefox.sh from the archive");
    const trip = unzipTo(join(out, "firefox-source.zip"), join(work, "round-trip"));
    run("sh", ["./build-firefox.sh"], trip);
    const rebuiltZip = join(trip, "out", `${config.packageName}-${version}-firefox.zip`);
    if (!existsSync(rebuiltZip)) throw new Error(`build-firefox.sh made no ${rebuiltZip}`);
    const uploaded = unzipTo(join(out, "firefox.zip"), join(work, "uploaded"));
    const rebuilt = unzipTo(rebuiltZip, join(work, "rebuilt"));
    const { problems, count } = sameFiles(uploaded, rebuilt);
    if (problems.length > 0) throw new Error(`the source archive does not rebuild firefox.zip:\n  ${problems.join("\n  ")}`);
    console.log(`identical: ${count} files`);

    step("Payload hashes");
    const chrome = unzipTo(join(out, "chrome.zip"), join(work, "chrome"));
    console.log(`chrome.zip   ${payloadHash(chrome)}`);
    console.log(`firefox.zip  ${payloadHash(uploaded)}`);
    for (const name of ["chrome.zip", "firefox.zip", "firefox-source.zip"]) {
      console.log(`${name.padEnd(19)} sha256 ${sha256(readFileSync(join(out, name)))}`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
