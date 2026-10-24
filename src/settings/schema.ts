// SPDX-License-Identifier: Apache-2.0
// The settings file, schema version 1 (SETTINGS.md), and its validation.
//
// A file is either usable or not. It is not usable when it is not a JSON object, when
// `schemaVersion` is not exactly 1, or when a required field is missing or of the wrong type;
// the caller then keeps its last good copy (store.ts). Inside a usable file, a single source
// can still be dropped, and the rest kept:
//   - a template that is not an absolute https:// URL;
//   - a template with a placeholder this extension does not know;
//   - a template whose host is not one the extension may request images from (IMAGE_HOSTS);
// Unknown extra fields are ignored, among them the obsolete `cardLink` (the tooltip no longer
// has a link; files may still carry it, of any type). The optional `update` field (an addition proposed for
// unpacked installs) and the optional `details` field (the card details file) are read when they
// are well formed and ignored otherwise. The optional `release` field (the remote release pointer,
// SETTINGS.md) is kept as written: src/release/pointer.ts judges it where it is used, and a
// malformed one never makes the file unusable.

import { IMAGE_HOSTS, UPDATE_URL_PREFIX } from "../constants.js";
import { templateProblem } from "./templates.js";

export interface ImageSource {
  id: string;
  template: string;
}

export interface UpdateNotice {
  /** The newest released version, `x.y.z`. */
  latest: string;
  /** Where to get it: an https:// address. */
  url: string;
}

/** The card details file (src/details/): a path on the settings file's own host, and the
 *  file's SHA-256. */
export interface DetailsSource {
  path: string;
  sha256: string;
}

export interface Settings {
  schemaVersion: 1;
  updatedAt: string;
  namesOnly: boolean;
  primary: ImageSource | null;
  fallbacks: ImageSource[];
  update: UpdateNotice | null;
  details: DetailsSource | null;
  /** The `release` field as written (null when absent); see src/release/pointer.ts. */
  release?: unknown;
}

export interface Validation {
  /** The usable settings, or null when the file is not usable. */
  settings: Settings | null;
  /** Why the file is not usable, or which parts of it were dropped. For logs only. */
  problems: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A source object's shape; null when it is not `{ id: non-empty string, template: string }`. */
function sourceShape(value: unknown): ImageSource | null {
  if (!isObject(value)) return null;
  const { id, template } = value;
  if (typeof id !== "string" || id.length === 0 || typeof template !== "string") return null;
  return { id, template };
}

/** Why an image source cannot be used (it is dropped), or null when it can. */
export function imageSourceProblem(source: ImageSource, allowedHosts: readonly string[] = IMAGE_HOSTS): string | null {
  const problem = templateProblem(source.template);
  if (problem) return problem;
  const host = new URL(source.template.replace(/\{[A-Za-z]+\}/g, "x")).hostname;
  if (!allowedHosts.includes(host)) return `host ${host} is not one this extension may request images from`;
  return null;
}

const VERSION = /^\d+\.\d+\.\d+$/;

/** Whether an address is the prefix itself or a path, query or fragment below it. */
export function underPrefix(href: string, prefix: string): boolean {
  if (!href.startsWith(prefix)) return false;
  const next = href.charAt(prefix.length);
  return next === "" || next === "/" || next === "?" || next === "#";
}

function updateField(value: unknown, problems: string[]): UpdateNotice | null {
  if (value === undefined || value === null) return null;
  if (!isObject(value) || typeof value.latest !== "string" || typeof value.url !== "string") {
    problems.push("update: ignored (not { latest, url })");
    return null;
  }
  if (!VERSION.test(value.latest)) {
    problems.push("update: ignored (latest is not x.y.z)");
    return null;
  }
  let url: URL;
  try {
    url = new URL(value.url);
  } catch {
    problems.push("update: ignored (url is not an address)");
    return null;
  }
  if (url.protocol !== "https:") {
    problems.push("update: ignored (url is not https://)");
    return null;
  }
  if (UPDATE_URL_PREFIX === null || !underPrefix(url.href, UPDATE_URL_PREFIX)) {
    problems.push(UPDATE_URL_PREFIX === null ? "update: ignored (this build shows no update notice)" : `update: ignored (url is not under ${UPDATE_URL_PREFIX})`);
    return null;
  }
  return { latest: value.latest, url: url.href };
}

/** A clean relative path to a .json file: segments of letters, digits, ".", "_" and "-", none
 *  of them "." or "..", no leading slash. */
const DETAILS_PATH = /^(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*\.json$/;
const SHA256 = /^[0-9a-f]{64}$/;

function detailsField(value: unknown, problems: string[]): DetailsSource | null {
  if (value === undefined || value === null) return null;
  if (!isObject(value) || typeof value.path !== "string" || typeof value.sha256 !== "string") {
    problems.push("details: ignored (not { path, sha256 })");
    return null;
  }
  if (value.path.length > 200 || !DETAILS_PATH.test(value.path) || value.path.split("/").some((part) => part === "." || part === "..")) {
    problems.push("details: ignored (path is not a clean relative path to a .json file)");
    return null;
  }
  if (!SHA256.test(value.sha256)) {
    problems.push("details: ignored (sha256 is not 64 lowercase hex digits)");
    return null;
  }
  return { path: value.path, sha256: value.sha256 };
}

/** The details file's address: its path on the settings file's own host. Null without a settings
 *  address (a build that never fetches), or when it would leave that host. */
export function detailsUrl(details: DetailsSource, settingsUrl: string | null): string | null {
  if (settingsUrl === null) return null;
  const base = new URL(settingsUrl);
  const url = new URL(details.path, base);
  return url.origin === base.origin ? url.href : null;
}

/** Validate a parsed settings file. */
export function validateSettings(raw: unknown, allowedHosts: readonly string[] = IMAGE_HOSTS): Validation {
  const fail = (problem: string): Validation => ({ settings: null, problems: [problem] });
  if (!isObject(raw)) return fail("not a JSON object");
  if (raw.schemaVersion !== 1) return fail("schemaVersion is not 1");
  if (typeof raw.namesOnly !== "boolean") return fail("namesOnly is not true or false");
  if (typeof raw.updatedAt !== "string") return fail("updatedAt is not a string");
  if (!("primary" in raw)) return fail("primary is missing");
  if (!Array.isArray(raw.fallbacks)) return fail("fallbacks is not an array");

  let primary: ImageSource | null = null;
  if (raw.primary !== null) {
    primary = sourceShape(raw.primary);
    if (!primary) return fail("primary is not { id, template } or null");
  }
  const fallbacks: ImageSource[] = [];
  for (const [i, value] of raw.fallbacks.entries()) {
    const source = sourceShape(value);
    if (!source) return fail(`fallbacks[${i}] is not { id, template }`);
    fallbacks.push(source);
  }

  const problems: string[] = [];
  if (primary) {
    const problem = imageSourceProblem(primary, allowedHosts);
    if (problem) {
      problems.push(`primary dropped: ${problem}`);
      primary = null;
    }
  }
  const kept = fallbacks.filter((source, i) => {
    const problem = imageSourceProblem(source, allowedHosts);
    if (problem) problems.push(`fallbacks[${i}] dropped: ${problem}`);
    return problem === null;
  });
  return {
    settings: {
      schemaVersion: 1,
      updatedAt: raw.updatedAt,
      namesOnly: raw.namesOnly,
      primary,
      fallbacks: kept,
      update: updateField(raw.update, problems),
      details: detailsField(raw.details, problems),
      release: raw.release === undefined ? null : raw.release,
    },
    problems,
  };
}
