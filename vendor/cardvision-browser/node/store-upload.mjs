// node/store-upload.ts
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync as readFileSync5, realpathSync, writeFileSync as writeFileSync3 } from "node:fs";
import { basename as basename3 } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// node/store-amo.ts
import { createHmac, randomUUID } from "node:crypto";

// node/store-chrome.ts
var CHROME_API = "https://chromewebstore.googleapis.com";
var StoreError = class extends Error {
};
function itemName(item) {
  if (!/^[^/]+$/.test(item.publisherId) || !/^[^/]+$/.test(item.itemId)) throw new StoreError("a publisher or item id holds a slash");
  return `publishers/${item.publisherId}/items/${item.itemId}`;
}
async function call(item, method, path, body, contentType) {
  const fetchFn = item.fetchFn ?? fetch;
  const headers = { Authorization: `Bearer ${item.accessToken}` };
  if (contentType) headers["Content-Type"] = contentType;
  const res = await fetchFn(`${item.base ?? CHROME_API}/${path}`, { method, headers, body });
  const text = await res.text();
  if (!res.ok) throw new StoreError(`Chrome Web Store ${method} ${path}: HTTP ${res.status} ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}
async function chromeStatus(item) {
  return await call(item, "GET", `v2/${itemName(item)}:fetchStatus`);
}
var versions = (r) => (r?.distributionChannels ?? []).map((c) => c.crxVersion ?? "").filter(Boolean);
function chromeDecision(status, version) {
  if (status.takenDown) return { kind: "block", reason: "the item is taken down" };
  const submitted = status.submittedItemRevisionStatus;
  if (submitted?.state === "PENDING_REVIEW" || submitted?.state === "STAGED") {
    if (versions(submitted).includes(version)) return { kind: "skip", reason: `version ${version} is already submitted (${submitted.state})` };
    return submitted.state === "PENDING_REVIEW" ? { kind: "block", reason: "a submission is pending review (uploading now would cancel it)" } : { kind: "block", reason: "an approved revision is staged, waiting for its manual publish" };
  }
  if (versions(status.publishedItemRevisionStatus).includes(version)) return { kind: "skip", reason: `version ${version} is already published` };
  if (status.lastAsyncUploadState === "IN_PROGRESS") return { kind: "block", reason: "an earlier upload is still being processed" };
  return { kind: "go" };
}
async function chromeUpload(item, zip, options = {}) {
  const res = await call(item, "POST", `upload/v2/${itemName(item)}:upload`, zip, "application/zip");
  let state = res.uploadState ?? "UPLOAD_STATE_UNSPECIFIED";
  const sleep = options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  for (let k = 0; state === "IN_PROGRESS" && k < (options.maxPolls ?? 60); k++) {
    await sleep(options.pollMs ?? 5e3);
    state = (await chromeStatus(item)).lastAsyncUploadState ?? state;
  }
  if (state !== "SUCCEEDED") throw new StoreError(`Chrome Web Store upload ended in ${state}`);
  return { uploadState: state, crxVersion: res.crxVersion };
}
async function chromePublish(item, publishType) {
  const res = await call(item, "POST", `v2/${itemName(item)}:publish`, JSON.stringify({ publishType }), "application/json");
  const warnings = (res.warningInfo?.warnings ?? []).map((w) => [w.reason, w.description].filter(Boolean).join(": "));
  return { state: res.state, warnings };
}

// node/store-amo.ts
var AMO_API = "https://addons.mozilla.org";
var b64url = (data) => Buffer.from(data).toString("base64url");
function amoJwt(issuer, secret, nowSeconds, jti = randomUUID()) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iss: issuer, jti, iat: nowSeconds, exp: nowSeconds + 60 }));
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}
async function call2(a, method, path, body, contentType) {
  const fetchFn = a.fetchFn ?? fetch;
  const now = a.now ? a.now() : Math.floor(Date.now() / 1e3);
  const headers = { Authorization: `JWT ${amoJwt(a.issuer, a.secret, now)}` };
  if (contentType) headers["Content-Type"] = contentType;
  const res = await fetchFn(`${a.base ?? AMO_API}/api/v5/${path}`, { method, headers, body });
  const text = await res.text();
  if (!res.ok) throw new StoreError(`addons.mozilla.org ${method} ${path}: HTTP ${res.status} ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}
var addonPath = (a) => `addons/addon/${encodeURIComponent(a.addon)}`;
async function amoListed(a) {
  const out = [];
  let path = `${addonPath(a)}/versions/?filter=all_without_unlisted&page_size=50`;
  for (let page = 0; path && page < 20; page++) {
    const res = await call2(a, "GET", path);
    for (const v of res.results ?? []) if (v.channel === "listed") out.push(v);
    path = res.next ? res.next.replace(/^.*\/api\/v5\//, "") : null;
  }
  return out;
}
function amoDecision(listed, version) {
  const same = listed.find((v) => v.version === version);
  if (same) return { kind: "skip", reason: `version ${version} is already submitted (${same.file?.status ?? "status not reported"})`, versionId: same.id };
  const pending = listed.filter((v) => v.file?.status === "unreviewed");
  if (pending.length > 0) return { kind: "block", reason: `listed version ${pending.map((v) => v.version).join(", ")} is awaiting review` };
  return { kind: "go" };
}
async function amoValidate(a, s) {
  const form = new FormData();
  form.append("upload", new Blob([s.zip], { type: "application/zip" }), s.zipName);
  form.append("channel", "listed");
  let upload = await call2(a, "POST", "addons/upload/", form);
  const sleep = s.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  for (let k = 0; !upload.processed && k < (s.maxPolls ?? 180); k++) {
    await sleep(s.pollMs ?? 5e3);
    upload = await call2(a, "GET", `addons/upload/${encodeURIComponent(upload.uuid)}/`);
  }
  if (!upload.processed) throw new StoreError("addons.mozilla.org did not finish validating the upload");
  if (!upload.valid) throw new StoreError(`addons.mozilla.org validation failed: ${JSON.stringify(upload.validation).slice(0, 800)}`);
  return upload.uuid;
}
async function amoCreateVersion(a, uploadUuid, s) {
  const create = new FormData();
  create.append("upload", uploadUuid);
  if (s.source) create.append("source", new Blob([s.source.bytes], { type: "application/zip" }), s.source.name);
  const version = await call2(a, "POST", `${addonPath(a)}/versions/`, create);
  return { uploadUuid, versionId: version.id, version: version.version };
}
async function amoSetNotes(a, versionId, s) {
  const notes = {};
  if (s.releaseNotes) notes.release_notes = s.releaseNotes;
  if (s.approvalNotes) notes.approval_notes = s.approvalNotes;
  if (Object.keys(notes).length === 0) return false;
  await call2(a, "PATCH", `${addonPath(a)}/versions/${versionId}/`, JSON.stringify(notes), "application/json");
  return true;
}

// node/store-checks.ts
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
function fail(message) {
  throw new StoreError(message);
}
function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
  }
}
var isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isStr = (v) => typeof v === "string" && v.length > 0;
function onlyKeys(o, allowed, where) {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(`${where}: unknown key "${k}"`);
}
function readStoreConfig(path) {
  const o = readJson(path);
  if (!isObj(o)) fail(`${path}: must be an object`);
  onlyKeys(o, ["chrome", "firefox", "deny"], path);
  const out = {};
  if (o.chrome !== void 0) {
    if (!isObj(o.chrome) || !isStr(o.chrome.publisherId) || !isStr(o.chrome.itemId)) fail(`${path}: chrome needs publisherId and itemId`);
    onlyKeys(o.chrome, ["publisherId", "itemId"], `${path} chrome`);
    out.chrome = { publisherId: o.chrome.publisherId, itemId: o.chrome.itemId };
  }
  if (o.firefox !== void 0) {
    if (!isObj(o.firefox) || !isStr(o.firefox.addon)) fail(`${path}: firefox needs addon (its id, slug or guid)`);
    onlyKeys(o.firefox, ["addon"], `${path} firefox`);
    out.firefox = { addon: o.firefox.addon };
  }
  if (o.deny !== void 0) {
    if (!Array.isArray(o.deny) || !o.deny.every(isStr)) fail(`${path}: deny must be a list of strings`);
    out.deny = o.deny;
  }
  if (!out.chrome && !out.firefox) fail(`${path}: names no store item`);
  return out;
}
function readReleaseFile(path) {
  const o = readJson(path);
  if (!isObj(o)) fail(`${path}: must be an object`);
  onlyKeys(o, ["version", "chrome", "firefox", "permissionsChanged", "before", "expect"], path);
  if (!isStr(o.version)) fail(`${path}: version is required`);
  const out = { version: o.version };
  if (o.chrome !== void 0) {
    if (!isObj(o.chrome)) fail(`${path}: chrome must be an object`);
    onlyKeys(o.chrome, ["submit", "publish"], `${path} chrome`);
    if (o.chrome.submit !== "auto" && o.chrome.submit !== "upload-only") fail(`${path}: chrome.submit must be "auto" or "upload-only"`);
    if (o.chrome.publish !== "default" && o.chrome.publish !== "staged") fail(`${path}: chrome.publish must be "default" or "staged"`);
    out.chrome = { submit: o.chrome.submit, publish: o.chrome.publish };
  }
  if (o.firefox !== void 0) {
    if (!isObj(o.firefox)) fail(`${path}: firefox must be an object`);
    onlyKeys(o.firefox, ["releaseNotes", "approvalNotes"], `${path} firefox`);
    const f = {};
    if (o.firefox.releaseNotes !== void 0) {
      if (!isObj(o.firefox.releaseNotes) || !Object.values(o.firefox.releaseNotes).every(isStr)) {
        fail(`${path}: firefox.releaseNotes maps locales to files`);
      }
      f.releaseNotes = o.firefox.releaseNotes;
    }
    if (o.firefox.approvalNotes !== void 0) {
      if (!isStr(o.firefox.approvalNotes)) fail(`${path}: firefox.approvalNotes is a file path`);
      f.approvalNotes = o.firefox.approvalNotes;
    }
    out.firefox = f;
  }
  if (o.permissionsChanged !== void 0) {
    if (typeof o.permissionsChanged !== "boolean") fail(`${path}: permissionsChanged must be true or false`);
    out.permissionsChanged = o.permissionsChanged;
  }
  if (o.before !== void 0) {
    if (!Array.isArray(o.before)) fail(`${path}: before must be a list`);
    out.before = o.before.map((b, i) => {
      if (!isObj(b) || !isStr(b.url) || !/^https:\/\//.test(b.url)) fail(`${path}: before[${i}] needs an https url`);
      onlyKeys(b, ["url", "sha256", "why"], `${path} before[${i}]`);
      if (b.sha256 !== void 0 && !(isStr(b.sha256) && /^[0-9a-f]{64}$/.test(b.sha256))) fail(`${path}: before[${i}].sha256 must be 64 hex`);
      return { url: b.url, ...b.sha256 ? { sha256: b.sha256 } : {}, ...isStr(b.why) ? { why: b.why } : {} };
    });
  }
  if (o.expect !== void 0) {
    if (!Array.isArray(o.expect)) fail(`${path}: expect must be a list`);
    out.expect = o.expect.map((b, i) => {
      if (!isObj(b) || !isStr(b.url) || !/^https:\/\//.test(b.url)) fail(`${path}: expect[${i}] needs an https url`);
      onlyKeys(b, ["url", "file", "sha256", "when", "why"], `${path} expect[${i}]`);
      if (b.file === void 0 === (b.sha256 === void 0)) fail(`${path}: expect[${i}] needs exactly one of file and sha256`);
      if (b.file !== void 0 && (!isStr(b.file) || b.file.startsWith("/") || b.file.split("/").includes(".."))) fail(`${path}: expect[${i}].file is a path beside the release file`);
      if (b.sha256 !== void 0 && !(isStr(b.sha256) && /^[0-9a-f]{64}$/.test(b.sha256))) fail(`${path}: expect[${i}].sha256 must be 64 hex`);
      if (b.when !== void 0 && b.when !== "always" && b.when !== "published") fail(`${path}: expect[${i}].when is "always" or "published"`);
      return { url: b.url, ...b.file ? { file: b.file } : {}, ...b.sha256 ? { sha256: b.sha256 } : {}, ...b.when ? { when: b.when } : {}, ...isStr(b.why) ? { why: b.why } : {} };
    });
  }
  return out;
}
function notesText(raw) {
  return raw.replace(/^\s*<!--\s*SPDX-License-Identifier:[^>]*-->\s*/, "").trim();
}
var AMO_APPROVAL_NOTES_LIMIT = 3e3;
function readNotes(releasePath, release) {
  const dir = dirname(resolve(releasePath));
  const read = (p) => {
    const text = notesText(readFileSync(join(dir, p), "utf-8"));
    if (!text) fail(`${p} is empty`);
    return text;
  };
  const out = {};
  if (release.firefox?.releaseNotes) {
    out.releaseNotes = Object.fromEntries(Object.entries(release.firefox.releaseNotes).map(([locale, p]) => [locale, read(p)]));
  }
  if (release.firefox?.approvalNotes) {
    out.approvalNotes = read(release.firefox.approvalNotes);
    const length = [...out.approvalNotes].length;
    if (length > AMO_APPROVAL_NOTES_LIMIT) {
      fail(`${release.firefox.approvalNotes} is ${length} characters; addons.mozilla.org accepts at most ${AMO_APPROVAL_NOTES_LIMIT} for notes to reviewers (counted without the license comment)`);
    }
  }
  return out;
}
var sorted = (values) => [...new Set([...values].filter((v) => typeof v === "string"))].sort();
function permissionSurface(manifest) {
  const arr = (v) => Array.isArray(v) ? v : [];
  const cs = arr(manifest.content_scripts).flatMap((c) => isObj(c) ? arr(c.matches) : []);
  const war = arr(manifest.web_accessible_resources).flatMap((w) => isObj(w) ? arr(w.matches) : []);
  const ec = isObj(manifest.externally_connectable) ? arr(manifest.externally_connectable.matches) : [];
  const gecko = isObj(manifest.browser_specific_settings) && isObj(manifest.browser_specific_settings.gecko) ? manifest.browser_specific_settings.gecko : {};
  const dc = isObj(gecko.data_collection_permissions) ? Object.entries(gecko.data_collection_permissions).flatMap(([k, v]) => arr(v).map((x) => `${k}:${String(x)}`)) : [];
  return {
    permissions: sorted(arr(manifest.permissions)),
    optional_permissions: sorted(arr(manifest.optional_permissions)),
    host_permissions: sorted(arr(manifest.host_permissions)),
    optional_host_permissions: sorted(arr(manifest.optional_host_permissions)),
    content_script_matches: sorted(cs),
    web_accessible_matches: sorted(war),
    externally_connectable: sorted(ec),
    data_collection: sorted(dc)
  };
}
function surfaceChanges(before, after) {
  const out = [];
  for (const key of Object.keys(after)) {
    const was = new Set(before[key] ?? []);
    const now = new Set(after[key]);
    for (const v of now) if (!was.has(v)) out.push(`${key}: + ${v}`);
    for (const v of was) if (!now.has(v)) out.push(`${key}: - ${v}`);
  }
  return out;
}
var DENY_PATTERNS = [
  /\bfeatureFlags\b/,
  /\bcardvision\s+cdn\b/i,
  /\bwrangler\b/i,
  /toJSON\(\s*secrets\s*\)/,
  /\bsecrets:\s*inherit\b/
];
function credentialName(identifier) {
  const parts = identifier.toUpperCase().split("_").filter(Boolean);
  if (parts.some((p) => p === "R2" || p === "S3" || p === "CLOUDFLARE")) return true;
  const secretish = parts.some((p) => ["KEY", "SECRET", "TOKEN", "ACCESS", "SESSION"].includes(p));
  if (secretish && parts.some((p) => p === "CDN" || p === "AWS")) return true;
  return parts[0] === "CF" && parts.some((p) => ["KEY", "TOKEN", "ACCOUNT", "SECRET"].includes(p));
}
function denyFindings(text, extra = []) {
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const id of line.match(/[A-Za-z0-9_]+/g) ?? []) if (id.includes("_") && credentialName(id)) out.push(`line ${i + 1}: ${id}`);
    for (const re of DENY_PATTERNS) {
      const m = line.match(re);
      if (m) out.push(`line ${i + 1}: ${m[0]}`);
    }
    for (const word of extra) {
      if (word && line.toLowerCase().includes(word.toLowerCase())) out.push(`line ${i + 1}: ${word}`);
    }
  });
  return out;
}
function deniedEnvNames(env, extra = []) {
  return Object.keys(env).filter((name) => denyFindings(name, extra).length > 0).sort();
}
function manifestEntry(entries) {
  const files = entries.filter((e) => e !== "" && !e.endsWith("/") && !e.startsWith("__MACOSX/"));
  if (files.includes("manifest.json")) return "manifest.json";
  if (files.length === 0 || files.some((e) => !e.includes("/"))) return null;
  const tops = new Set(files.map((e) => e.slice(0, e.indexOf("/"))));
  if (tops.size !== 1) return null;
  const path = `${[...tops][0]}/manifest.json`;
  return files.includes(path) ? path : null;
}
var lintFindings = (value, path, field) => {
  if (!Array.isArray(value)) throw new StoreError(`${path}: ${field} must be a list`);
  return value.map((v) => {
    const o = typeof v === "object" && v !== null ? v : {};
    if (typeof o.code !== "string") throw new StoreError(`${path}: a ${field} entry has no code`);
    return { code: o.code, file: typeof o.file === "string" ? o.file : "" };
  });
};
function readLintReport(path) {
  let o;
  try {
    o = JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    throw new StoreError(`${path}: not a web-ext lint JSON report (${error.message})`);
  }
  return { errors: lintFindings(o.errors, path, "errors"), warnings: lintFindings(o.warnings, path, "warnings") };
}
function readLintBaseline(path) {
  let o;
  try {
    o = JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    throw new StoreError(
      `${path}: ${error.message} (a product starts it from the template's store/lint-baseline.json, docs/store-uploads.md)`
    );
  }
  return lintFindings(o.warnings, path, "warnings");
}
function lintProblems(report, baseline) {
  const key = (f) => `${f.code} in ${f.file || "(no file)"}`;
  const left = /* @__PURE__ */ new Map();
  for (const f of baseline) left.set(key(f), (left.get(key(f)) ?? 0) + 1);
  const problems = report.errors.map((f) => `lint error ${key(f)}`);
  for (const f of report.warnings) {
    const n = left.get(key(f)) ?? 0;
    if (n > 0) left.set(key(f), n - 1);
    else problems.push(`new lint warning ${key(f)} (not in the baseline)`);
  }
  const gone = [];
  for (const f of baseline) {
    const n = left.get(key(f)) ?? 0;
    if (n > 0) {
      gone.push(f);
      left.set(key(f), n - 1);
    }
  }
  return { problems, gone };
}
async function beforeProblems(release, fetchFn = fetch) {
  const out = [];
  for (const b of release.before ?? []) {
    try {
      const res = await fetchFn(b.url, { method: "GET", cache: "no-store" });
      if (res.status !== 200) {
        out.push(`${b.url}: HTTP ${res.status}${b.why ? ` (${b.why})` : ""}`);
        continue;
      }
      if (b.sha256) {
        const got = createHash("sha256").update(new Uint8Array(await res.arrayBuffer())).digest("hex");
        if (got !== b.sha256) out.push(`${b.url}: sha256 ${got.slice(0, 16)}\u2026 is not ${b.sha256.slice(0, 16)}\u2026`);
      }
    } catch (error) {
      out.push(`${b.url}: ${error.message}`);
    }
  }
  return out;
}
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// node/store-google.ts
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync as readFileSync2, statSync } from "node:fs";
import { parseEnv } from "node:util";
var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
var CWS_SCOPE = "https://www.googleapis.com/auth/chromewebstore";
var ENV_FILE_NAMES = ["AMO_JWT_ISSUER", "AMO_JWT_SECRET", "CWS_SERVICE_ACCOUNT_KEY_FILE", "CWS_ACCESS_TOKEN"];
function readPrivateFile(path, what) {
  let mode;
  try {
    mode = statSync(path).mode & 511;
  } catch {
    throw new StoreError(`the ${what} ${path} cannot be read`);
  }
  if ((mode & 63) !== 0) {
    throw new StoreError(`the ${what} ${path} can be read by other users (mode ${mode.toString(8).padStart(4, "0")}): run chmod 600 ${path}`);
  }
  try {
    return readFileSync2(path, "utf-8");
  } catch {
    throw new StoreError(`the ${what} ${path} cannot be read`);
  }
}
function readEnvFile(path) {
  const values = parseEnv(readPrivateFile(path, "env file"));
  const unknown = Object.keys(values).filter((name) => !ENV_FILE_NAMES.includes(name));
  if (unknown.length > 0) {
    throw new StoreError(`the env file ${path} sets names that are not store credentials: ${unknown.sort().join(", ")} (allowed: ${ENV_FILE_NAMES.join(", ")})`);
  }
  return values;
}
var b64url2 = (data) => Buffer.from(data).toString("base64url");
async function serviceAccountToken(keyPath, o) {
  const text = readPrivateFile(keyPath, "service-account key file");
  let key;
  try {
    key = JSON.parse(text);
  } catch {
    throw new StoreError(`the service-account key file ${keyPath} is not JSON`);
  }
  if (typeof key?.client_email !== "string" || typeof key.private_key !== "string") {
    throw new StoreError(`the service-account key file ${keyPath} has no client_email and private_key: download a JSON key for the service account`);
  }
  let privateKey;
  try {
    privateKey = createPrivateKey(key.private_key);
  } catch {
    throw new StoreError(`the private_key in ${keyPath} is not a usable key`);
  }
  const tokenUrl = o.tokenUrl ?? GOOGLE_TOKEN_URL;
  const iat = Math.floor(o.now ?? Date.now() / 1e3);
  const header = b64url2(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url2(JSON.stringify({ iss: key.client_email, scope: CWS_SCOPE, aud: tokenUrl, iat, exp: iat + 3600 }));
  const signature = sign("sha256", Buffer.from(`${header}.${claims}`), privateKey).toString("base64url");
  const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${signature}` });
  let res;
  try {
    res = await o.fetchFn(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  } catch {
    throw new StoreError(`Google's token address ${tokenUrl} could not be reached`);
  }
  let reply = {};
  try {
    reply = await res.json();
  } catch {
  }
  if (!res.ok) {
    const code = typeof reply.error === "string" && /^[a-z_]{1,40}$/.test(reply.error) ? ` (${reply.error})` : "";
    throw new StoreError(`Google refused a token for the service account in ${keyPath}: HTTP ${res.status}${code}`);
  }
  if (typeof reply.access_token !== "string" || reply.access_token === "") {
    throw new StoreError(`Google's token reply for the service account in ${keyPath} has no access token`);
  }
  return reply.access_token;
}

// node/store-status.ts
import { readdirSync, readFileSync as readFileSync3, writeFileSync } from "node:fs";
import { basename, dirname as dirname2, join as join2, resolve as resolve2 } from "node:path";
var CHROME_UPDATE_API = "https://clients2.google.com/service/update2/crx";
var NUMERIC = /^\d+(?:\.\d+){0,3}$/;
function compareVersions(a, b) {
  if (!NUMERIC.test(a) || !NUMERIC.test(b)) return null;
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
function newestRelease(dir) {
  const found = readdirSync(dir).filter((n) => n.endsWith(".json")).sort().map((n) => ({ path: join2(dir, n), release: readReleaseFile(join2(dir, n)) }));
  if (found.length === 0) throw new StoreError(`${basename(dir)} holds no release file`);
  for (const f of found) {
    if (basename(f.path) !== `${f.release.version}.json`) throw new StoreError(`${basename(f.path)} names version ${f.release.version}: a release file is named for its version`);
  }
  let best = found[0];
  for (const f of found.slice(1)) {
    const c = compareVersions(f.release.version, best.release.version);
    if (c === null) throw new StoreError(`cannot order the release versions ${f.release.version} and ${best.release.version}`);
    if (c > 0) best = f;
  }
  return { ...best, count: found.length };
}
var BACKOFF_MS = [3e4, 12e4];
var TIMEOUT_MS = 2e4;
async function get(fetchFn, url, sleep) {
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await (sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))))(BACKOFF_MS[attempt - 1]);
    try {
      const res = await fetchFn(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.status < 500 && res.status !== 429) return res;
      last = `HTTP ${res.status}`;
    } catch (error) {
      last = error.message;
    }
  }
  throw new StoreError(`${last} after 3 tries`);
}
var attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? null;
async function chromePublicVersion(itemId, deps) {
  const url = `${deps.chromeUpdateBase ?? CHROME_UPDATE_API}?response=updatecheck&prodversion=999.0&acceptformat=crx3&x=${encodeURIComponent(`id=${itemId}&uc`)}`;
  const res = await get(deps.fetchFn, url, deps.sleep);
  if (res.status !== 200) throw new StoreError(`Chrome Web Store update service: HTTP ${res.status}`);
  const xml = await res.text();
  const app = xml.match(/<app\s[^>]*>/)?.[0];
  if (!app) throw new StoreError("Chrome Web Store update service: an answer with no app element");
  if (attr(app, "appid") !== itemId) throw new StoreError("Chrome Web Store update service: answered for another item");
  const status = attr(app, "status");
  if (status === "error-unknownApplication") return null;
  if (status !== "ok") throw new StoreError(`Chrome Web Store update service: item status ${status ?? "missing"}`);
  const check = xml.match(/<updatecheck\s[^>]*>/)?.[0];
  const version = check ? attr(check, "version") : null;
  if (!check || attr(check, "status") !== "ok" || !version) throw new StoreError("Chrome Web Store update service: no version for the item");
  return version;
}
async function amoPublicVersion(addon, deps) {
  const res = await get(deps.fetchFn, `${deps.amoBase ?? AMO_API}/api/v5/addons/addon/${encodeURIComponent(addon)}/`, deps.sleep);
  if (res.status === 404 || res.status === 401 || res.status === 403) return null;
  if (res.status !== 200) throw new StoreError(`addons.mozilla.org: HTTP ${res.status}`);
  const body = await res.json();
  const v = body.current_version?.version;
  return typeof v === "string" && v ? v : null;
}
function readState(path) {
  const empty = { schemaVersion: 1, highWater: {} };
  if (!path) return { state: empty, read: false };
  let raw;
  try {
    raw = readFileSync3(path, "utf-8");
  } catch {
    return { state: empty, read: false, note: "No earlier run's versions to compare with: a version that went back cannot be told this time." };
  }
  try {
    const o = JSON.parse(raw);
    const high = {};
    for (const t of ["chrome", "firefox"]) if (typeof o.highWater?.[t] === "string") high[t] = o.highWater[t];
    return { state: { schemaVersion: 1, highWater: high }, read: true };
  } catch {
    return { state: empty, read: false, note: "The earlier run's versions could not be read and are ignored." };
  }
}
async function runStatus(a, deps) {
  const { release, path: releasePath, count } = newestRelease(a.releasesDir);
  const problems = [];
  const notes = [];
  const lines = [`## Store status: newest release file ${release.version}`, ""];
  const high = { ...a.state?.highWater ?? {} };
  let allPublic = true;
  const names = { chrome: "Chrome Web Store", firefox: "addons.mozilla.org" };
  for (const target of ["chrome", "firefox"]) {
    const item = a.config[target];
    if (!item) continue;
    let published;
    try {
      published = target === "chrome" ? await chromePublicVersion(a.config.chrome.itemId, deps) : await amoPublicVersion(a.config.firefox.addon, deps);
    } catch (error) {
      problems.push(`${names[target]}: cannot read the public version: ${error.message}`);
      allPublic = false;
      continue;
    }
    if (published === null) {
      allPublic = false;
      if (high[target] !== void 0) problems.push(`${names[target]}: lists no public version, though ${high[target]} was public on an earlier run (taken down?)`);
      else if (count > 1 && !a.stateRead) problems.push(`${names[target]}: lists no public version, though earlier releases exist (${count - 1} earlier release file(s))`);
      else notes.push(`${names[target]}: no public version yet. ${release.version} is in review, or not submitted.`);
      lines.push(`- ${names[target]}: no public version`);
      continue;
    }
    lines.push(`- ${names[target]}: public ${published}`);
    const order = compareVersions(published, release.version);
    if (order === null) {
      if (published !== release.version) problems.push(`${names[target]}: public ${published} cannot be ordered against ${release.version}, and is not equal to it`);
    } else if (order > 0) {
      problems.push(`${names[target]}: public ${published} is newer than the newest release file ${release.version}`);
    } else if (order < 0) {
      allPublic = false;
      notes.push(`${names[target]}: ${release.version} is not public yet (public: ${published}). In review, or not submitted.`);
    }
    const seen = high[target];
    const back = seen === void 0 ? null : compareVersions(published, seen);
    if (back !== null && back < 0) problems.push(`${names[target]}: the public version went back from ${seen} to ${published}`);
    else if (seen === void 0 || back === null || back > 0) high[target] = published;
  }
  const dir = dirname2(resolve2(releasePath));
  for (const [i, e] of (release.expect ?? []).entries()) {
    if (e.when === "published" && !allPublic) {
      notes.push(`expect ${i + 1} (${e.url}): not checked until ${release.version} is public.`);
      continue;
    }
    const label = `${e.url}${e.why ? ` (${e.why})` : ""}`;
    try {
      const res = await get(deps.fetchFn, e.url, deps.sleep);
      if (res.status !== 200) {
        problems.push(`${label}: HTTP ${res.status}`);
        continue;
      }
      const got = sha256(new Uint8Array(await res.arrayBuffer()));
      const want = e.sha256 ?? sha256(deps.readFile(join2(dir, e.file)));
      if (got !== want) problems.push(`${label}: the live bytes (sha256 ${got.slice(0, 16)}\u2026) are not ${e.file ? basename(e.file) : "the expected hash"} (${want.slice(0, 16)}\u2026)`);
      else lines.push(`- expect: ${label} matches`);
    } catch (error) {
      problems.push(`${label}: ${error.message}`);
    }
  }
  for (const n of notes) lines.push("", `Note: ${n}`);
  lines.push("", problems.length === 0 ? "**No fault found.**" : `**${problems.length} problem(s):**`, ...problems.map((p) => `- ${p}`));
  return { problems, notes, lines, state: { schemaVersion: 1, highWater: high } };
}
var writeState = (path, state) => writeFileSync(path, `${JSON.stringify(state, null, 2)}
`);

// node/store-record.ts
import { copyFileSync, mkdirSync, readFileSync as readFileSync4, writeFileSync as writeFileSync2 } from "node:fs";
import { basename as basename2, join as join3 } from "node:path";
var RECORD_SCHEMA = 1;
var RECORD_JSON = "release-record.json";
var RECORD_MARKDOWN = "release-record.md";
var SUMS_FILE = "SHA256SUMS";
var isObj2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var HEX40 = /^[0-9a-f]{40}$/;
function readJson2(path, what) {
  try {
    return JSON.parse(readFileSync4(path, "utf-8"));
  } catch (error) {
    throw new StoreError(`cannot read the ${what} ${basename2(path)}: ${error.message}`);
  }
}
function readVendorFacts(path) {
  const m = readJson2(path, "vendor manifest");
  if (!isObj2(m) || m.schemaVersion !== 1 || !isObj2(m.toolkit) || typeof m.toolkit.commit !== "string" || !HEX40.test(m.toolkit.commit)) {
    throw new StoreError(`${basename2(path)} is not a version 1 vendor manifest with a toolkit commit`);
  }
  const version = typeof m.toolkit.version === "string" ? m.toolkit.version : "";
  const ort = isObj2(m.ort) && typeof m.ort.version === "string" ? m.ort.version : null;
  const opencv = isObj2(m.opencv) && typeof m.opencv.tag === "string" && typeof m.opencv.commit === "string" ? { tag: m.opencv.tag, commit: m.opencv.commit } : null;
  return { toolkit: { version, commit: m.toolkit.commit }, ort, opencv };
}
function readFactsFile(path) {
  const o = readJson2(path, "facts file");
  if (!isObj2(o) || !isObj2(o.facts) || Object.keys(o).some((k) => k !== "facts")) throw new StoreError(`${basename2(path)} must be {"facts": {...}}`);
  const out = {};
  for (const [k, v] of Object.entries(o.facts).sort(([a], [b]) => a < b ? -1 : 1)) {
    if (!/^[A-Za-z][A-Za-z0-9]{0,39}$/.test(k)) throw new StoreError(`${basename2(path)}: "${k}" is not a plain name (letters and digits)`);
    if (typeof v === "string" ? v.length === 0 || v.length > 200 : typeof v !== "number" && typeof v !== "boolean") {
      throw new StoreError(`${basename2(path)}: "${k}" must be a short text, a number or true or false`);
    }
    out[k] = v;
  }
  return out;
}
function contentsDigest(files) {
  const lines = [...files].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0).map((f) => `${f.sha256}  ${f.name}
`);
  return { files: files.length, contentsSha256: sha256(new TextEncoder().encode(lines.join(""))) };
}
function readCiResults(path, ownRunId) {
  const text = readFileSync4(path, "utf-8").trim();
  const items = [];
  const add = (v) => {
    if (Array.isArray(v)) v.forEach(add);
    else if (isObj2(v) && Array.isArray(v.check_runs)) v.check_runs.forEach(add);
    else items.push(v);
  };
  try {
    add(JSON.parse(text));
  } catch {
    for (const line of text.split("\n").filter((l) => l.trim() !== "")) {
      try {
        add(JSON.parse(line));
      } catch {
        throw new StoreError(`${basename2(path)} is not check-run JSON`);
      }
    }
  }
  const out = [];
  for (const o of items) {
    if (!isObj2(o) || typeof o.name !== "string" || o.name.length === 0 || o.name.length > 200) throw new StoreError(`${basename2(path)}: a check run has no name`);
    const url = typeof o.details_url === "string" ? o.details_url : "";
    const runId = url.match(/\/actions\/runs\/(\d+)/)?.[1] ?? null;
    if (runId !== null && runId === ownRunId) continue;
    out.push({ name: o.name, status: typeof o.status === "string" ? o.status : "unknown", conclusion: typeof o.conclusion === "string" ? o.conclusion : null, runId });
  }
  return out.sort((a, b) => a.name + (a.runId ?? "") < b.name + (b.runId ?? "") ? -1 : 1);
}
function readRuntimesRow(path, version) {
  const o = readJson2(path, "runtime table");
  if (!isObj2(o)) throw new StoreError(`${basename2(path)} must be an object of versions`);
  const row = o[version];
  if (!isObj2(row)) throw new StoreError(`${basename2(path)} has no row for version ${version}`);
  const id = isObj2(row.bundledRelease) && typeof row.bundledRelease.id === "string" ? row.bundledRelease.id : null;
  if (!id) throw new StoreError(`${basename2(path)}: the row for ${version} names no bundledRelease id`);
  return { ortWeb: typeof row.ortWeb === "string" ? row.ortWeb : null, releaseId: id };
}
function sortedDeep(v) {
  if (Array.isArray(v)) return v.map(sortedDeep);
  if (!isObj2(v)) return v;
  return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortedDeep(v[k])]));
}
function recordJson(record) {
  return `${JSON.stringify(sortedDeep(record), null, 2)}
`;
}
var ROLE_NAMES = [
  ["chrome", "Chrome Web Store package"],
  ["firefox", "Firefox package"],
  ["firefoxSource", "Firefox source archive (not attached to the release)"],
  ["loadUnpacked", "Load-unpacked package"]
];
function recordMarkdown(r) {
  const out = [`# Release record ${r.version}`, "", `Machine facts only. Tag \`${r.tag}\`${r.commit ? `, commit \`${r.commit}\`` : ""}${r.runId ? `, run ${r.runId}` : ""}.`, ""];
  out.push("## Packages", "", "| Package | File | Bytes | SHA-256 | Files | Contents SHA-256 |", "| --- | --- | ---: | --- | ---: | --- |");
  for (const [role, label] of ROLE_NAMES) {
    const p = r.packages[role];
    if (p) out.push(`| ${label} | \`${p.file}\` | ${p.bytes} | \`${p.sha256}\` | ${p.files ?? ""} | ${p.contentsSha256 ? `\`${p.contentsSha256}\`` : ""} |`);
  }
  out.push("", "## Build", "");
  out.push(r.toolkit ? `- Vendored toolkit: version ${r.toolkit.version || "(not named)"}, commit \`${r.toolkit.commit}\`` : "- Vendored toolkit: not recorded");
  if (r.ort) out.push(`- ONNX Runtime: ${r.ort}`);
  if (r.opencv) out.push(`- OpenCV: ${r.opencv.tag}, commit \`${r.opencv.commit}\``);
  if (r.modelRelease) out.push(`- Bundled model release: ${r.modelRelease}`);
  out.push(r.lint ? `- Firefox lint: ${r.lint.errors} errors, ${r.lint.warnings} warnings (${r.lint.inBaseline} in the baseline)` : "- Firefox lint: not run");
  out.push(`- Addresses checked before upload: ${r.beforeUpload.checked}`);
  if (r.chrome) out.push(`- Chrome: submit ${r.chrome.submit}, publish ${r.chrome.publish}`);
  for (const [k, v] of Object.entries(r.facts)) out.push(`- ${k}: ${String(v)}`);
  if (r.ci) {
    out.push("", "## Checks on the commit", "");
    if (r.ci.length === 0) out.push("No other check runs.");
    for (const c of r.ci) out.push(`- ${c.name}: ${c.conclusion ?? c.status}${c.runId ? ` (run ${c.runId})` : ""}`);
  }
  out.push("", "## Permissions", "", r.permissionsChanged ? "The permission surface changed since the previous release." : "No permission change is recorded for this release.", "");
  for (const target of ["chrome", "firefox"]) {
    const s = r.permissions[target];
    if (!s) continue;
    out.push(`### ${target}`, "");
    for (const key of Object.keys(s)) out.push(`- ${key}: ${s[key].length === 0 ? "none" : s[key].map((x) => `\`${x}\``).join(", ")}`);
    out.push("");
  }
  return `${out.join("\n").trimEnd()}
`;
}
var LOCAL_PATH = /(?:^|[\s"'`(=])(?:\/(?:Users|home|tmp|var|private|opt|etc|root|runner|mnt|Volumes|github|__w)\/|~[/]|[A-Za-z]:[\\/]|\\{2,}[^\s\\"]+\\|file:\/\/\/(?:Users|home|tmp|var|private|opt|etc|root|runner|mnt|Volumes|github|__w)\/)/m;
var STORE_CREDENTIAL = /\b(?:AMO|CWS)_[A-Z0-9_]+\b|\bG(?:ITHUB|H)_TOKEN\b/;
function recordProblems(texts, deny) {
  const out = [];
  for (const text of texts) {
    if (LOCAL_PATH.test(text)) out.push("the release record names a local path");
    const store = text.match(STORE_CREDENTIAL);
    if (store) out.push(`the release record names a credential (${store[0]})`);
    for (const f of denyFindings(text, deny)) out.push(`the release record names a denied name (${f.replace(/^line \d+: /, "")})`);
    for (const id of text.match(/[A-Za-z0-9_]+/g) ?? []) if (id.includes("_") && credentialName(id)) out.push(`the release record names a credential (${id})`);
  }
  return [...new Set(out)];
}
var WRITES = /\bcontents\s*:\s*["']?write["']?(?![\w-])|["']?write-all["']?/;
function workflowGuardProblems(workflowText) {
  const lines = workflowText.split(/\r?\n/);
  const live = (l) => l.trim() !== "" && !l.trimStart().startsWith("#");
  const indentOf = (l) => l.length - l.trimStart().length;
  const jobsAt = lines.findIndex((l) => /^jobs:\s*(#.*)?$/.test(l));
  if (jobsAt < 0) return ["the workflow has no `jobs:` block the check can read"];
  const problems = [];
  const top = [];
  let inJobs = false;
  let topPerm = false;
  for (const l of lines) {
    if (/^jobs:/.test(l)) inJobs = true;
    else if (live(l) && indentOf(l) === 0) {
      inJobs = false;
      topPerm = /^["']?permissions["']?\s*:/.test(l);
      if (topPerm) top.push(l);
    } else if (!inJobs && topPerm) top.push(l);
  }
  const topWrites = top.some((l) => WRITES.test(l));
  const body = lines.slice(jobsAt + 1);
  const first = body.find(live);
  const jobIndent = first === void 0 ? -1 : indentOf(first);
  const jobs = [];
  for (const l of body) {
    if (!live(l)) continue;
    const ind = indentOf(l);
    if (ind === 0) break;
    if (ind === jobIndent) {
      const m = l.match(/^\s*([A-Za-z0-9_-]+):\s*$/);
      const commented = l.match(/^\s*([A-Za-z0-9_-]+):\s*#/);
      if (commented) {
        problems.push(`the job ${commented[1]}: a comment on its header line hides what follows from this check; move the comment`);
        jobs.push({ name: commented[1], lines: [] });
      } else if (!m) {
        problems.push(`a line under jobs: is not a plain job header: ${l.trim().slice(0, 40)}`);
        jobs.push({ name: "(unreadable)", lines: [] });
      } else jobs.push({ name: m[1], lines: [] });
    } else jobs.at(-1)?.lines.push(l);
  }
  if (jobs.length === 0) problems.push("`jobs:` has no job the check recognizes");
  let anyEnvironment = false;
  for (const j of jobs) {
    const childIndent = j.lines.length > 0 ? Math.min(...j.lines.map(indentOf)) : 0;
    const keys = j.lines.filter((l) => indentOf(l) === childIndent);
    const hasEnv = keys.some((l) => /^\s*["']?environment["']?\s*:/.test(l));
    const permAt = j.lines.findIndex((l) => indentOf(l) === childIndent && /^\s*["']?permissions["']?\s*:/.test(l));
    if (hasEnv) anyEnvironment = true;
    let writes = false;
    if (permAt >= 0) {
      const block = [j.lines[permAt]];
      for (const l of j.lines.slice(permAt + 1)) {
        if (indentOf(l) <= childIndent) break;
        block.push(l);
      }
      writes = block.some((l) => WRITES.test(l));
    }
    if (hasEnv && permAt < 0) problems.push(`the job ${j.name} names an environment and has no permissions of its own (it would inherit the workflow's)`);
    if (hasEnv && writes) problems.push(`the job ${j.name} can write to the repository and names an environment (a job with store access must not)`);
  }
  if (anyEnvironment && topWrites) problems.push("the workflow grants write permission at its top level while a job names an environment");
  return problems;
}
function releaseAssets(a, readFile = (p) => new Uint8Array(readFileSync4(p))) {
  const record = readJson2(a.recordJson, "release record");
  if (!isObj2(record) || record.schemaVersion !== RECORD_SCHEMA || !isObj2(record.packages)) throw new StoreError(`${basename2(a.recordJson)} is not a version ${RECORD_SCHEMA} release record`);
  mkdirSync(a.outDir, { recursive: true });
  const sums = [];
  const names = [];
  for (const role of ["loadUnpacked", "chrome", "firefox"]) {
    const p = record.packages[role];
    if (!p) continue;
    if (basename2(p.file) !== p.file) throw new StoreError(`the record names ${role} as a path, not a file name`);
    if (sha256(readFile(join3(a.dir, p.file))) !== p.sha256) throw new StoreError(`${p.file} is not the package the build job checked`);
    copyFileSync(join3(a.dir, p.file), join3(a.outDir, p.file));
    sums.push(`${p.sha256}  ${p.file}`);
    names.push(p.file);
  }
  if (names.length === 0) throw new StoreError("the record names no package to attach");
  for (const [name, text] of [
    [RECORD_JSON, readFileSync4(a.recordJson, "utf-8")],
    [RECORD_MARKDOWN, readFileSync4(a.recordJson.replace(/\.json$/, ".md"), "utf-8")]
  ]) {
    writeFileSync2(join3(a.outDir, name), text);
    sums.push(`${sha256(new TextEncoder().encode(text))}  ${name}`);
    names.push(name);
  }
  writeFileSync2(join3(a.outDir, SUMS_FILE), `${sums.join("\n")}
`);
  return [...names, SUMS_FILE];
}

// node/store-upload.ts
function defaultZipManifest(zipPath) {
  const entries = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf-8", maxBuffer: 64 << 20 }).split("\n");
  const path = manifestEntry(entries);
  if (!path) throw new StoreError(`${basename3(zipPath)} has no manifest.json at its root or in a single top-level folder`);
  if (/[*?[\]\\]/.test(path)) throw new StoreError(`${basename3(zipPath)}: rename the folder ${path.slice(0, path.indexOf("/"))}: no * ? [ ] or \\ in it`);
  const text = execFileSync("unzip", ["-p", zipPath, path], { encoding: "utf-8" });
  return { path, manifest: JSON.parse(text) };
}
function defaultZipFiles(zipPath) {
  const names = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf-8", maxBuffer: 64 << 20 }).split("\n").filter((n) => n !== "" && !n.endsWith("/"));
  return names.map((name) => {
    if (name.startsWith("-") || /[*?[\]\\]/.test(name)) throw new StoreError(`${basename3(zipPath)}: a file name starts with - or holds * ? [ ] or \\ (${name.slice(0, 40)})`);
    return { name, sha256: sha256(new Uint8Array(execFileSync("unzip", ["-p", zipPath, name], { maxBuffer: 1 << 30 }))) };
  });
}
var DEFAULT_DEPS = {
  env: process.env,
  fetchFn: fetch,
  readFile: (p) => new Uint8Array(readFileSync5(p)),
  zipManifest: defaultZipManifest,
  zipFiles: defaultZipFiles,
  log: (line) => console.log(line)
};
var Usage = class extends Error {
};
function surfaceFile(path) {
  const o = JSON.parse(readFileSync5(path, "utf-8"));
  if (typeof o !== "object" || o === null) throw new StoreError(`${path}: must be an object`);
  return o;
}
var sameSurface = (a, b) => !!a && surfaceChanges(a, b).length === 0;
async function runCheck(a, deps) {
  const problems = [];
  const summary = [];
  const config = readStoreConfig(a.config);
  const release = readReleaseFile(a.release);
  summary.push(`## Store release ${release.version}`, "");
  if (a.tag !== `${a.tagPrefix}${release.version}`) problems.push(`the tag ${a.tag} is not ${a.tagPrefix}${release.version}`);
  for (const w of a.workflows) {
    const text = readFileSync5(w, "utf-8");
    for (const f of denyFindings(text, config.deny)) problems.push(`${w} mentions a denied name (${f})`);
    for (const p of workflowGuardProblems(text)) problems.push(`${w}: ${p}`);
  }
  const committed = surfaceFile(a.permissions);
  const previous = a.previousPermissions ? surfaceFile(a.previousPermissions) : null;
  const hashes = {};
  const targets = [
    ["chrome", a.chromeZip],
    ["firefox", a.firefoxZip]
  ];
  let changed = false;
  const facts = { chrome: void 0, firefox: void 0, firefoxSource: void 0, loadUnpacked: void 0 };
  const surfaces = {};
  for (const [target, zip] of targets) {
    if (!zip) continue;
    if (!config[target]) problems.push(`a ${target} package was given but ${a.config} names no ${target} item`);
    const { path: manifestPath, manifest } = deps.zipManifest(zip);
    if (target === "firefox" && manifestPath !== "manifest.json") problems.push(`${basename3(zip)}: addons.mozilla.org needs manifest.json at the zip's root, not ${manifestPath}`);
    if (manifest.version !== release.version) problems.push(`${basename3(zip)} is version ${String(manifest.version)}, the release is ${release.version}`);
    const gecko = manifest.browser_specific_settings?.gecko;
    if (target === "chrome" && manifest.key !== void 0) problems.push(`${basename3(zip)} carries a key (a store package must not)`);
    if (target === "firefox" && !gecko) problems.push(`${basename3(zip)} has no gecko settings`);
    const surface = permissionSurface(manifest);
    if (!sameSurface(committed[target], surface)) {
      const diff = committed[target] ? surfaceChanges(committed[target], surface) : ["(no entry)"];
      problems.push(`${target}: the package's permissions differ from ${a.permissions}: ${diff.join("; ")}`);
    }
    if (previous) {
      const diff = previous[target] ? surfaceChanges(previous[target], surface) : [];
      if (diff.length > 0) {
        changed = true;
        summary.push(`**${target} permission change:** ${diff.join("; ")}`, "");
      }
    }
    const bytes = deps.readFile(zip);
    hashes[basename3(zip)] = sha256(bytes);
    facts[target] = { file: basename3(zip), bytes: bytes.length, sha256: hashes[basename3(zip)], manifestVersion: String(manifest.version) };
    if (a.recordOut) Object.assign(facts[target], contentsDigest((deps.zipFiles ?? defaultZipFiles)(zip)));
    surfaces[target] = surface;
    const folder = manifestPath === "manifest.json" ? "" : `, files in \`${manifestPath.slice(0, -"manifest.json".length)}\``;
    summary.push(`- ${target}: \`${basename3(zip)}\` ${bytes.length} bytes${folder}, sha256 \`${hashes[basename3(zip)]}\``);
  }
  if (a.firefoxSource) {
    const bytes = deps.readFile(a.firefoxSource);
    hashes[basename3(a.firefoxSource)] = sha256(bytes);
    facts.firefoxSource = { file: basename3(a.firefoxSource), bytes: bytes.length, sha256: hashes[basename3(a.firefoxSource)] };
    summary.push(`- firefox source: \`${basename3(a.firefoxSource)}\` sha256 \`${hashes[basename3(a.firefoxSource)]}\``);
  } else if (a.firefoxZip) {
    summary.push("- firefox source: none (the add-on's code is not minified or generated)");
  }
  if (a.loadUnpackedZip) {
    const { manifest } = deps.zipManifest(a.loadUnpackedZip);
    const name = basename3(a.loadUnpackedZip);
    if (manifest.version !== release.version) problems.push(`${name} is version ${String(manifest.version)}, the release is ${release.version}`);
    const bytes = deps.readFile(a.loadUnpackedZip);
    hashes[name] = sha256(bytes);
    facts.loadUnpacked = { file: name, bytes: bytes.length, sha256: hashes[name], manifestVersion: String(manifest.version) };
    if (a.recordOut) Object.assign(facts.loadUnpacked, contentsDigest((deps.zipFiles ?? defaultZipFiles)(a.loadUnpackedZip)));
    summary.push(`- load-unpacked: \`${name}\` ${bytes.length} bytes, sha256 \`${hashes[name]}\``);
  }
  let lintFact = null;
  if (a.lintBaseline && !a.lint) problems.push("--lint-baseline needs --lint (the web-ext lint JSON report)");
  if (!a.lint && a.firefoxZip) summary.push("- firefox lint: no report given (--lint), not checked");
  if (a.lint) {
    const baseline = a.lintBaseline ? readLintBaseline(a.lintBaseline) : [];
    const report = readLintReport(a.lint);
    const lint = lintProblems(report, baseline);
    problems.push(...lint.problems);
    const known = report.warnings.length - lint.problems.filter((p) => p.startsWith("new lint warning")).length;
    lintFact = { errors: report.errors.length, warnings: report.warnings.length, inBaseline: known };
    summary.push(`- firefox lint: ${report.errors.length} errors, ${report.warnings.length} warnings (${known} in the baseline)`);
    if (lint.gone.length > 0) {
      summary.push(`- firefox lint: no longer warned, can leave the baseline: ${lint.gone.map((f) => `${f.code} in ${f.file}`).join("; ")}`);
    }
  }
  if (!previous && (a.chromeZip || a.firefoxZip)) {
    summary.push("", "No previous release's permissions: not compared.");
  }
  if (previous) {
    if (changed && !release.permissionsChanged) problems.push("the permissions changed: set permissionsChanged in the release file once the store justifications are updated");
    if (!changed && release.permissionsChanged) problems.push("permissionsChanged is set but nothing changed since the previous release");
  }
  if (release.chrome) {
    summary.push(
      "",
      release.chrome.submit === "auto" ? `Chrome: upload, then submit for review (${release.chrome.publish === "staged" ? "publish by hand after approval" : "live once approved"}).` : "Chrome: upload only. Paste the listing text in the dashboard, then submit."
    );
  }
  try {
    const notes = readNotes(a.release, release);
    for (const [locale, text] of Object.entries(notes.releaseNotes ?? {})) summary.push("", `Firefox release notes (${locale}):`, "", ...text.split("\n").map((l) => `> ${l}`));
    if (notes.approvalNotes) summary.push("", "Firefox notes to reviewers:", "", ...notes.approvalNotes.split("\n").map((l) => `> ${l}`));
  } catch (error) {
    problems.push(error.message);
  }
  for (const p of await beforeProblems(release, deps.fetchFn)) problems.push(`before upload: ${p}`);
  if ((release.before ?? []).length > 0) summary.push("", `Before upload: ${(release.before ?? []).length} address(es) checked.`);
  if ((a.ciResults || a.runtimes) && !a.recordOut) throw new Usage("--ci-results and --runtimes go with --record-out");
  if (a.recordOut) {
    if (!a.recordOut.endsWith(".json")) throw new Usage("--record-out names a .json file (the Markdown is written beside it)");
    if (!a.vendorManifest) throw new Usage("--record-out needs --vendor-manifest");
    if (a.commit !== void 0 && !/^[0-9a-f]{40}$/.test(a.commit)) throw new Usage("--commit must be a full 40-character SHA");
    if (a.runId !== void 0 && !/^[0-9]{1,20}$/.test(a.runId)) throw new Usage("--run-id must be digits");
    const vendor = readVendorFacts(a.vendorManifest);
    const productFacts = a.facts ? readFactsFile(a.facts) : {};
    if (productFacts.modelRelease !== void 0 && typeof productFacts.modelRelease !== "string") throw new StoreError(`${basename3(a.facts)}: modelRelease must be text (a release id), not ${typeof productFacts.modelRelease}`);
    const record = {
      schemaVersion: RECORD_SCHEMA,
      version: release.version,
      tag: a.tag,
      commit: a.commit ?? null,
      runId: a.runId ?? null,
      ...vendor,
      modelRelease: typeof productFacts.modelRelease === "string" ? productFacts.modelRelease : null,
      ci: a.ciResults ? readCiResults(a.ciResults, a.runId) : null,
      packages: Object.fromEntries(Object.entries(facts).filter(([, v]) => v)),
      permissions: surfaces,
      permissionsChanged: release.permissionsChanged === true,
      chrome: release.chrome ? { submit: release.chrome.submit, publish: release.chrome.publish } : null,
      lint: lintFact,
      beforeUpload: { checked: (release.before ?? []).length },
      facts: Object.fromEntries(Object.entries(productFacts).filter(([k]) => k !== "modelRelease"))
    };
    if (a.runtimes) {
      try {
        const row = readRuntimesRow(a.runtimes, release.version);
        if (record.modelRelease === null) problems.push(`the record names no model release: set modelRelease in the facts file (${basename3(a.runtimes)} says ${row.releaseId})`);
        else if (record.modelRelease !== row.releaseId) problems.push(`the bundled model release ${record.modelRelease} is not ${row.releaseId}, the row of ${release.version} in ${basename3(a.runtimes)}`);
        if (row.ortWeb && record.ort && row.ortWeb !== record.ort) problems.push(`the vendored ONNX Runtime ${record.ort} is not ${row.ortWeb}, the row of ${release.version} in ${basename3(a.runtimes)}`);
      } catch (error) {
        problems.push(error.message);
      }
    }
    const json = recordJson(record);
    const markdown = recordMarkdown(record);
    const refused = recordProblems([json, markdown], config.deny ?? []);
    problems.push(...refused);
    if (refused.length === 0) {
      writeFileSync3(a.recordOut, json);
      writeFileSync3(a.recordOut.replace(/\.json$/, ".md"), markdown);
      summary.push("", `Release record written (${basename3(a.recordOut)}, ${basename3(a.recordOut.replace(/\.json$/, ".md"))}).`);
    }
  }
  if (a.hashesOut) writeFileSync3(a.hashesOut, `${JSON.stringify(hashes, null, 2)}
`);
  summary.push("", problems.length === 0 ? "**All checks passed.**" : `**${problems.length} problem(s):**`, ...problems.map((p) => `- ${p}`));
  return { problems, summary, hashes };
}
function need(env, name) {
  const v = env[name];
  if (!v) throw new StoreError(`${name} is not set`);
  return v;
}
async function chromeToken(deps) {
  const token = deps.env.CWS_ACCESS_TOKEN;
  const keyFile = deps.env.CWS_SERVICE_ACCOUNT_KEY_FILE;
  if (token && keyFile) throw new StoreError("both CWS_ACCESS_TOKEN and CWS_SERVICE_ACCOUNT_KEY_FILE are set: keep one");
  if (keyFile) return serviceAccountToken(keyFile, { fetchFn: deps.fetchFn, tokenUrl: deps.googleTokenUrl });
  if (!token) throw new StoreError("CWS_ACCESS_TOKEN is not set, nor CWS_SERVICE_ACCOUNT_KEY_FILE");
  return token;
}
async function runUpload(a, deps, report = () => void 0) {
  const config = readStoreConfig(a.config);
  const release = readReleaseFile(a.release);
  const out = [];
  const say = (line) => {
    out.push(line);
    report(line);
  };
  const denied = deniedEnvNames(deps.env, config.deny);
  if (denied.length > 0) throw new StoreError(`the upload job's environment holds denied names: ${denied.join(", ")}`);
  const expected = JSON.parse(readFileSync5(a.hashes, "utf-8"));
  const files = [
    [a.chromeZip, "chrome package"],
    [a.firefoxZip, "firefox package"],
    [a.firefoxSource, "firefox source"]
  ];
  const bytes = /* @__PURE__ */ new Map();
  for (const [path, what] of files) {
    if (!path) continue;
    const b = deps.readFile(path);
    const want = expected[basename3(path)];
    if (!want) throw new StoreError(`the build job recorded no hash for the ${what} ${basename3(path)}`);
    if (sha256(b) !== want) throw new StoreError(`the ${what} ${basename3(path)} is not the one the build job checked`);
    bytes.set(path, b);
  }
  const notes = a.targets.includes("firefox") ? readNotes(a.release, release) : {};
  let chrome = null;
  let amo = null;
  if (a.targets.includes("chrome")) {
    if (!config.chrome || !release.chrome || !a.chromeZip) throw new StoreError("chrome needs a config item, a release-file chrome block and --chrome-zip");
    chrome = { ...config.chrome, accessToken: await chromeToken(deps), fetchFn: deps.fetchFn, base: deps.chromeBase };
  }
  if (a.targets.includes("firefox")) {
    if (!config.firefox || !a.firefoxZip) throw new StoreError("firefox needs a config item and --firefox-zip");
    amo = {
      addon: config.firefox.addon,
      issuer: need(deps.env, "AMO_JWT_ISSUER"),
      secret: need(deps.env, "AMO_JWT_SECRET"),
      fetchFn: deps.fetchFn,
      base: deps.amoBase
    };
  }
  const blockers = [];
  for (const p of await beforeProblems(release, deps.fetchFn)) blockers.push(`before upload: ${p}`);
  if (chrome) {
    const d = chromeDecision(await chromeStatus(chrome), release.version);
    if (d.kind === "block") blockers.push(`Chrome Web Store: ${d.reason}`);
    if (d.kind === "skip") {
      say(`Chrome Web Store: skipped, ${d.reason}.`);
      chrome = null;
    }
  }
  let amoNotesOnly = null;
  if (amo) {
    const d = amoDecision(await amoListed(amo), release.version);
    if (d.kind === "block") blockers.push(`addons.mozilla.org: ${d.reason}`);
    if (d.kind === "skip") {
      say(`addons.mozilla.org: skipped, ${d.reason}.`);
      if (d.versionId !== void 0) amoNotesOnly = { addon: amo, versionId: d.versionId };
      amo = null;
    }
  }
  if (blockers.length > 0) throw new StoreError(`nothing was uploaded: ${blockers.join("; ")}`);
  say(`Prechecks passed: ${a.targets.join(", ")}.`);
  if (a.precheckOnly) return out;
  const done = () => out.length > 0 ? ` Done before this: ${out.join(" ")}` : "";
  try {
    const submission = amo ? {
      zip: bytes.get(a.firefoxZip),
      zipName: basename3(a.firefoxZip),
      source: a.firefoxSource ? { bytes: bytes.get(a.firefoxSource), name: basename3(a.firefoxSource) } : void 0,
      releaseNotes: notes.releaseNotes,
      approvalNotes: notes.approvalNotes,
      sleep: deps.sleep
    } : null;
    const amoUpload = amo ? await amoValidate(amo, submission) : null;
    if (amoUpload) say("addons.mozilla.org: the package passed validation.");
    if (chrome) {
      const up = await chromeUpload(chrome, bytes.get(a.chromeZip), { sleep: deps.sleep });
      say(`Chrome Web Store: uploaded (${up.uploadState}${up.crxVersion ? `, version ${up.crxVersion}` : ""}).`);
      if (release.chrome.submit === "auto") {
        const pub = await chromePublish(chrome, release.chrome.publish === "staged" ? "STAGED_PUBLISH" : "DEFAULT_PUBLISH");
        say(`Chrome Web Store: submitted for review (${pub.state ?? "state not reported"}).`);
        for (const w of pub.warnings) say(`Chrome Web Store warning: ${w}`);
      } else {
        say("Chrome Web Store: not submitted. Paste the listing text in the dashboard, then submit.");
      }
    }
    if (amo && amoUpload) {
      const res = await amoCreateVersion(amo, amoUpload, submission);
      say(`addons.mozilla.org: version ${res.version} submitted for review${a.firefoxSource ? " with its source code" : ""}.`);
      if (await amoSetNotes(amo, res.versionId, notes)) say("addons.mozilla.org: notes set.");
    }
    if (amoNotesOnly && await amoSetNotes(amoNotesOnly.addon, amoNotesOnly.versionId, notes)) {
      say("addons.mozilla.org: notes set again on the existing version.");
    }
  } catch (error) {
    throw new StoreError(`${error.message}.${done()}`);
  }
  return out;
}
var USAGE = `usage:
  node store-upload.mjs check --config FILE --release FILE --tag TAG [--tag-prefix v] --permissions FILE
       [--previous-permissions FILE] [--chrome-zip Z] [--firefox-zip Z] [--firefox-source S]
       --workflow FILE [--workflow FILE\u2026] [--lint REPORT [--lint-baseline FILE]]
       [--hashes-out FILE] [--summary FILE] [--load-unpacked-zip Z]
       [--record-out FILE.json --vendor-manifest FILE [--facts FILE] [--commit SHA] [--run-id ID]
       [--ci-results FILE] [--runtimes FILE]]
  node store-upload.mjs status --config FILE --releases DIR [--state-in FILE] [--state-out FILE] [--summary FILE]
  node store-upload.mjs assets --record FILE.json --dir DIR --out-dir DIR
  node store-upload.mjs upload --config FILE --release FILE --targets chrome,firefox --hashes FILE
       [--chrome-zip Z] [--firefox-zip Z] [--firefox-source S] [--precheck-only] [--summary FILE]
       [--env-file FILE]`;
async function main(argv, deps = DEFAULT_DEPS) {
  const [command, ...rest] = argv;
  let summaryPath;
  if (command === "--help" || command === "-h") {
    deps.log(USAGE);
    return 0;
  }
  try {
    const { values } = parseArgs({
      args: rest,
      options: {
        config: { type: "string" },
        release: { type: "string" },
        tag: { type: "string" },
        "tag-prefix": { type: "string", default: "v" },
        permissions: { type: "string" },
        "previous-permissions": { type: "string" },
        "chrome-zip": { type: "string" },
        "firefox-zip": { type: "string" },
        "firefox-source": { type: "string" },
        workflow: { type: "string", multiple: true },
        "hashes-out": { type: "string" },
        lint: { type: "string" },
        "lint-baseline": { type: "string" },
        hashes: { type: "string" },
        targets: { type: "string" },
        "precheck-only": { type: "boolean", default: false },
        summary: { type: "string" },
        "env-file": { type: "string" },
        "load-unpacked-zip": { type: "string" },
        "record-out": { type: "string" },
        "vendor-manifest": { type: "string" },
        facts: { type: "string" },
        commit: { type: "string" },
        "run-id": { type: "string" },
        "ci-results": { type: "string" },
        runtimes: { type: "string" },
        record: { type: "string" },
        releases: { type: "string" },
        "state-in": { type: "string" },
        "state-out": { type: "string" },
        dir: { type: "string" },
        "out-dir": { type: "string" },
        help: { type: "boolean", short: "h", default: false }
      }
    });
    if (values.help || !command) {
      deps.log(USAGE);
      return command ? 0 : 2;
    }
    if (command === "status") {
      if (values["env-file"]) throw new Usage("--env-file is for upload: status uses no credentials");
      if (!values.config || !values.releases) throw new Usage("status needs --config and --releases");
      summaryPath = values.summary;
      const { state, note, read } = readState(values["state-in"]);
      const res = await runStatus({ config: readStoreConfig(values.config), releasesDir: values.releases, state, stateRead: read }, deps);
      if (note) res.lines.splice(2, 0, `Note: ${note}`, "");
      for (const line of res.lines) deps.log(line);
      if (values.summary) appendFileSync(values.summary, `${res.lines.join("\n")}
`);
      if (values["state-out"]) writeState(values["state-out"], res.state);
      return res.problems.length === 0 ? 0 : 1;
    }
    if (command === "assets") {
      if (!values.record || !values.dir || !values["out-dir"]) throw new Usage("assets needs --record, --dir and --out-dir");
      for (const name of releaseAssets({ recordJson: values.record, dir: values.dir, outDir: values["out-dir"] }, deps.readFile)) deps.log(`asset: ${name}`);
      return 0;
    }
    if (!values.config || !values.release) throw new Usage("--config and --release are required");
    summaryPath = values.summary;
    const writeSummary = (lines) => {
      if (values.summary) appendFileSync(values.summary, `${lines.join("\n")}
`);
    };
    if (command === "check") {
      if (values["env-file"]) throw new Usage("--env-file is for upload: check uses no credentials");
      if (!values.tag || !values.permissions || !values.workflow?.length) throw new Usage("check needs --tag, --permissions and --workflow");
      const res = await runCheck(
        {
          config: values.config,
          release: values.release,
          tag: values.tag,
          tagPrefix: values["tag-prefix"],
          permissions: values.permissions,
          previousPermissions: values["previous-permissions"],
          chromeZip: values["chrome-zip"],
          firefoxZip: values["firefox-zip"],
          firefoxSource: values["firefox-source"],
          workflows: values.workflow,
          hashesOut: values["hashes-out"],
          lint: values.lint,
          lintBaseline: values["lint-baseline"],
          loadUnpackedZip: values["load-unpacked-zip"],
          recordOut: values["record-out"],
          vendorManifest: values["vendor-manifest"],
          facts: values.facts,
          commit: values.commit,
          runId: values["run-id"],
          ciResults: values["ci-results"],
          runtimes: values.runtimes
        },
        deps
      );
      for (const line of res.summary) deps.log(line);
      writeSummary(res.summary);
      return res.problems.length === 0 ? 0 : 1;
    }
    if (command === "upload") {
      if (!values.hashes || !values.targets) throw new Usage("upload needs --hashes and --targets");
      if (values["env-file"]) deps = { ...deps, env: { ...readEnvFile(values["env-file"]), ...deps.env } };
      const targets = values.targets.split(",").map((t) => t.trim()).filter(Boolean);
      for (const t of targets) if (t !== "chrome" && t !== "firefox") throw new Usage(`unknown target ${t}`);
      const report = (line) => {
        deps.log(line);
        writeSummary([`- ${line}`]);
      };
      await runUpload(
        {
          config: values.config,
          release: values.release,
          targets,
          hashes: values.hashes,
          chromeZip: values["chrome-zip"],
          firefoxZip: values["firefox-zip"],
          firefoxSource: values["firefox-source"],
          precheckOnly: values["precheck-only"]
        },
        deps,
        report
      );
      return 0;
    }
    throw new Usage(`unknown command ${command}`);
  } catch (error) {
    if (error instanceof Usage || error.code?.startsWith("ERR_PARSE_ARGS")) {
      deps.log(`${error.message}
${USAGE}`);
      return 2;
    }
    deps.log(`refused: ${error.message}`);
    if (summaryPath) appendFileSync(summaryPath, `
**Refused:** ${error.message}
`);
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
if (isEntry()) process.exit(await main(process.argv.slice(2)));
export {
  DEFAULT_DEPS,
  defaultZipFiles,
  main,
  runCheck,
  runUpload
};
