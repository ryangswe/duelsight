// node/release-decide.ts
import { appendFileSync, existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
var VERSION = /^(\d+)\.(\d+)\.(\d+)$/;
var TAG_REF = /^([0-9a-f]{40})\s+refs\/tags\/(.+?)(\^\{\})?$/;
var DATE = /\b\d{4}-\d{2}-\d{2}\b/;
function compareVersions(a, b) {
  const x = VERSION.exec(a);
  const y = VERSION.exec(b);
  if (!x || !y) throw new Error(`not a version: ${!x ? a : b}`);
  for (let i = 1; i <= 3; i++) {
    const m = Number(x[i]);
    const n = Number(y[i]);
    if (m !== n) return m < n ? -1 : 1;
  }
  return 0;
}
function tagsFromApi(refs, objects = "") {
  const lines = (text) => text.split("\n").filter((l) => l.trim() !== "").map((l) => JSON.parse(l));
  const tagObjects = /* @__PURE__ */ new Map();
  for (const entry of lines(objects)) {
    if (entry.sha && entry.object?.sha && entry.object.type) tagObjects.set(entry.sha, { type: entry.object.type, sha: entry.object.sha });
  }
  const out = [];
  for (const entry of lines(refs)) {
    if (!entry.ref?.startsWith("refs/tags/") || !entry.object?.sha || !entry.object.type) continue;
    let { type, sha } = entry.object;
    for (let hops = 0; type === "tag" && hops < 5; hops++) {
      const next = tagObjects.get(sha);
      if (!next) break;
      ({ type, sha } = next);
    }
    out.push(`${sha}	${entry.ref}`);
  }
  return out.join("\n");
}
function tagsOf(listing, prefix) {
  const commits = /* @__PURE__ */ new Map();
  for (const line of listing.split("\n")) {
    const m = TAG_REF.exec(line.trim());
    if (m?.[1] && m[2] && (m[3] || !commits.has(m[2]))) commits.set(m[2], m[1]);
  }
  const versions = [...commits.keys()].filter((t) => t.startsWith(prefix) && VERSION.test(t.slice(prefix.length))).map((t) => t.slice(prefix.length));
  return { commits, versions };
}
function notesFor(changelog, version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = new RegExp(`^##[ \\t]+\\[?v?${escaped}\\]?([ \\t].*)?$`, "gm");
  for (const found of changelog.matchAll(heading)) {
    if (!DATE.test(found[1] ?? "")) continue;
    const rest = changelog.slice(found.index + found[0].length);
    const next = /^## /m.exec(rest);
    const body = (next ? rest.slice(0, next.index) : rest).trim();
    if (body !== "") return `${body}
`;
  }
  return null;
}
function plan(action, reason, tag, rest = {}) {
  return { action, reason, tag, create: false, dispatch: false, notes: "", ...rest };
}
function decide(f) {
  const tag = `${f.tagPrefix}${f.version}`;
  if (/^\d+\.\d+\.\d+-./.test(f.version)) {
    if (!f.releaseFile) return plan("nothing", `${f.version} has a pre-release suffix and no release file; nothing to release.`, tag);
    return plan("refuse", `The version ${f.version} has a pre-release suffix; store versions are numeric (X.Y.Z), so nothing was created.`, tag);
  }
  if (!VERSION.test(f.version)) return plan("refuse", `The version ${JSON.stringify(f.version)} in package.json is not X.Y.Z.`, tag);
  const { commits, versions } = tagsOf(f.tags, f.tagPrefix);
  const at = commits.get(tag);
  if (at !== void 0 && at !== f.commit) return plan("nothing", `${tag} is already tagged on an earlier commit; the version is not raised.`, tag);
  const notes = notesFor(f.changelog, f.version);
  const missing = [];
  if (!f.releaseFile) missing.push(`the release file for ${f.version} does not exist`);
  if (notes === null) missing.push(`the changelog has no dated, non-empty section for ${f.version}`);
  if (at === void 0) {
    if (missing.length > 0) return plan("nothing", `${tag} is not released: ${missing.join(" and ")}.`, tag);
    const newest = versions.reduce((best, v) => best === null || compareVersions(v, best) > 0 ? v : best, null);
    if (newest !== null && compareVersions(f.version, newest) < 0) {
      return plan("refuse", `${f.version} is lower than the newest final version tag, ${f.tagPrefix}${newest}; nothing was created.`, tag);
    }
    return plan("release", `Releasing ${tag}.`, tag, { create: true, dispatch: true, notes: notes ?? "" });
  }
  const create = !f.releaseExists && notes !== null;
  const dispatch = f.storeRuns === 0 && f.releaseFile;
  if (!create && !dispatch) {
    const why = missing.length > 0 && (!f.releaseExists || f.storeRuns === 0) ? `; ${missing.join(" and ")}` : "";
    return plan("nothing", `${tag} is already released and its store run already started${why}.`, tag);
  }
  const parts = [create ? "creating the release" : "", dispatch ? "starting the store run" : ""].filter(Boolean);
  return plan("release", `Finishing ${tag}: ${parts.join(" and ")}.`, tag, { create, dispatch, notes: create ? notes ?? "" : "" });
}
var USAGE = `usage:
  node release-decide.mjs --package-json FILE --releases-dir DIR --changelog FILE --commit SHA
       --tags-api FILE [--tag-objects FILE] --release-exists true|false --store-runs N --notes FILE
       [--tag-prefix v] [--output FILE] [--summary FILE]`;
var Usage = class extends Error {
};
function main(argv, log = console.log) {
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        "package-json": { type: "string" },
        "releases-dir": { type: "string" },
        changelog: { type: "string" },
        commit: { type: "string" },
        "tags-api": { type: "string" },
        "tag-objects": { type: "string" },
        "release-exists": { type: "string" },
        "store-runs": { type: "string" },
        notes: { type: "string" },
        "tag-prefix": { type: "string", default: "v" },
        output: { type: "string" },
        summary: { type: "string" },
        help: { type: "boolean", short: "h", default: false }
      }
    });
    if (values.help) {
      log(USAGE);
      return 0;
    }
    for (const name of ["package-json", "releases-dir", "changelog", "commit", "tags-api", "release-exists", "store-runs", "notes"]) {
      if (values[name] === void 0) throw new Usage(`--${name} is required`);
    }
    if (values["release-exists"] !== "true" && values["release-exists"] !== "false") throw new Usage("--release-exists is true or false");
    if (!/^\d+$/.test(values["store-runs"])) throw new Usage("--store-runs is a count");
    if (!/^[0-9a-f]{40}$/.test(values.commit)) throw new Usage("--commit is a full commit hash");
    let version;
    try {
      version = JSON.parse(readFileSync(values["package-json"], "utf-8")).version;
    } catch (error) {
      throw new Error(`cannot read the version from ${values["package-json"]}: ${error.message}`);
    }
    if (typeof version !== "string") throw new Error(`${values["package-json"]} has no version`);
    const releaseFile = VERSION.test(version) && existsSync(join(values["releases-dir"], `${version}.json`));
    const result = decide({
      version,
      tagPrefix: values["tag-prefix"],
      commit: values.commit,
      tags: tagsFromApi(
        readFileSync(values["tags-api"], "utf-8"),
        values["tag-objects"] ? readFileSync(values["tag-objects"], "utf-8") : ""
      ),
      releaseFile,
      changelog: readFileSync(values.changelog, "utf-8"),
      releaseExists: values["release-exists"] === "true",
      storeRuns: Number(values["store-runs"])
    });
    if (values.summary) appendFileSync(values.summary, `${result.action}: ${result.reason}
`);
    log(result.reason);
    if (result.action === "refuse") return 1;
    if (result.create) writeFileSync(values.notes, result.notes);
    if (values.output) {
      appendFileSync(values.output, `tag=${result.tag}
create=${result.create}
dispatch=${result.dispatch}
`);
    }
    return 0;
  } catch (error) {
    if (error instanceof Usage || error.code?.startsWith("ERR_PARSE_ARGS")) {
      log(`${error.message}
${USAGE}`);
      return 2;
    }
    log(`refused: ${error.message}`);
    return 1;
  }
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
  compareVersions,
  decide,
  main,
  notesFor,
  tagsFromApi,
  tagsOf
};
