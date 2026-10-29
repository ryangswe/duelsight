// node/package-zip.ts
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
function zipLayout(packageName, manifest) {
  const base = `${packageName}-${manifest.version}`;
  if (manifest.browser_specific_settings?.gecko) return { file: `${base}-firefox.zip`, folder: null, store: true, firefox: true };
  const store = !manifest.key;
  return store ? { file: `${base}-store.zip`, folder: null, store } : { file: `${base}.zip`, folder: base, store };
}
function writeZip(dist, zipPath, folder) {
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
var USAGE = "usage: node package-zip.mjs --dist DIR --package-name NAME --out DIR";
function main(argv) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: { dist: { type: "string" }, "package-name": { type: "string" }, out: { type: "string" }, help: { type: "boolean", short: "h", default: false } }
    }));
  } catch (error) {
    console.error(`${error.message}
${USAGE}`);
    return 2;
  }
  if (values.help) {
    console.log(`${USAGE}

Writes <NAME>-<version>[-store|-firefox].zip from DIR (which holds manifest.json) into --out and prints its path.`);
    return 0;
  }
  if (!values.dist || !values["package-name"] || !values.out) {
    console.error(USAGE);
    return 2;
  }
  const dist = resolve(values.dist);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf-8"));
  } catch (error) {
    console.error(`cannot read ${join(dist, "manifest.json")}: ${error.message}`);
    return 2;
  }
  if (typeof manifest?.version !== "string") {
    console.error(`${join(dist, "manifest.json")} has no version`);
    return 2;
  }
  const layout = zipLayout(values["package-name"], manifest);
  const out = resolve(values.out);
  mkdirSync(out, { recursive: true });
  const zipPath = join(out, layout.file);
  writeZip(dist, zipPath, layout.folder);
  console.log(zipPath);
  return 0;
}
function isEntry() {
  try {
    return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (isEntry()) process.exit(main(process.argv.slice(2)));
export {
  writeZip,
  zipLayout
};
