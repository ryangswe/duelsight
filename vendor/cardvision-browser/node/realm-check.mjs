// node/realm-check.ts
import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// scripts/realm-marks.mjs
var mark = (id, module, encoded) => ({ id, module, text: atob(encoded) });
var REALM_MARKS = [
  // The capture control: the text of the reason a second capture request is refused with. The one
  // exception to the rule above: it is a documented refusal reason, kept because the capture
  // control's runtime file must not change and every text it holds is such a reason. A bundle
  // beside the host's content file should not import that constant from the page-capture file
  // (doing so keeps a second copy of the text and fails the check). Move the mark to an internal
  // text when that runtime file next changes for another reason.
  mark("capture-control.ts:CAPTURE_PENDING_REASON", "src/capture-control.ts", "YSBjYXB0dXJlIGlzIGFscmVhZHkgcGVuZGluZw=="),
  // The compute frame: the text of the error a bad instance id throws, in the function that starts the frame.
  mark("compute-frame.ts:INSTANCE_REFUSAL", "src/compute-frame.ts", "c3RhcnRDb21wdXRlRnJhbWU6IG5vdCBhbiBpbnN0YW5jZSBpZA=="),
  // The settings core: the text of the error invalid bundled defaults throw, in the function that makes the core.
  mark("settings-core.ts:DEFAULTS_INVALID", "src/host/settings-core.ts", "Y3JlYXRlU2V0dGluZ3NDb3JlOiB0aGUgc2NoZW1hJ3MgZGVmYXVsdCBzZXR0aW5ncyBkbyBub3QgdmFsaWRhdGU=")
];
function countMark(source, text) {
  let count = 0;
  for (let at = source.indexOf(text); at !== -1; at = source.indexOf(text, at + text.length)) count += 1;
  return count;
}
function countMarks(source, marks = REALM_MARKS) {
  const found = [];
  for (const mark2 of marks) {
    const count = countMark(source, mark2.text);
    if (count > 0) found.push({ id: mark2.id, count });
  }
  return found;
}

// node/realm-check.ts
function realmFindings(file, source) {
  return countMarks(source).filter((found) => found.count > 1).map((found) => ({ file, id: found.id, count: found.count }));
}
function scriptFiles(path) {
  if (!statSync(path).isDirectory()) return [path];
  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) files.push(...scriptFiles(full));
    else if (/\.m?js$/.test(entry.name)) files.push(full);
  }
  return files.sort();
}
var USAGE = "usage: node realm-check.mjs FILE_OR_DIR...";
function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`${USAGE}

Fails when a built file holds a realm mark more than once (one runtime per realm).`);
    return 0;
  }
  if (argv.length === 0) {
    console.error(USAGE);
    return 2;
  }
  const findings = [];
  const holders = /* @__PURE__ */ new Map();
  let checked = 0;
  for (const arg of argv) {
    let files;
    try {
      files = scriptFiles(resolve(arg));
    } catch (error) {
      console.error(`cannot read ${arg}: ${error.message}`);
      return 2;
    }
    for (const file of files) {
      let source;
      try {
        source = readFileSync(file, "utf-8");
      } catch (error) {
        console.error(`cannot read ${file}: ${error.message}`);
        return 2;
      }
      checked += 1;
      for (const found of countMarks(source)) holders.set(found.id, (holders.get(found.id) ?? 0) + 1);
      findings.push(...realmFindings(file, source));
    }
  }
  for (const finding of findings) {
    console.error(`${finding.file}: the realm mark ${finding.id} occurs ${finding.count} times; one runtime per realm allows once, so this file may hold that module's code twice`);
  }
  if (checked === 0) {
    console.error("no .js or .mjs file to check: nothing was read");
    return 2;
  }
  const held = REALM_MARKS.map((mark2) => `${mark2.id} in ${holders.get(mark2.id) ?? 0}`).join(", ");
  if (findings.length > 0) return 1;
  console.log(`realm check: ${checked} file${checked === 1 ? "" : "s"}, no realm mark twice in one file (files holding each mark: ${held})`);
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
  realmFindings,
  scriptFiles
};
