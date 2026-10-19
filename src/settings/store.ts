// SPDX-License-Identifier: Apache-2.0
// Where the settings in effect come from (SETTINGS.md, "Failure rules").
//
//   - The settings file is fetched at start-up, then at most once an hour while the extension
//     runs (`refreshSettings`, called by the background on start-up and whenever a page asks).
//   - A usable file replaces the last good copy, kept in extension storage with the time it
//     was fetched.
//   - Anything else (unreachable, non-2xx, malformed JSON, schemaVersion other than 1, a required
//     field missing or of the wrong type) keeps the last good copy; with none, the built-in
//     default, a copy of the shipped config.json.
//
// The storage, the fetch and the clock are passed in, so the rules can be tested without a
// browser.

import { SETTINGS_REFRESH_MS, SETTINGS_URL } from "../constants.js";
// The built-in default is the published settings file itself (single source: cdn/config.json).
import DEFAULT_CONFIG from "../../cdn/config.json";
import { type Settings, validateSettings } from "./schema.js";

/** The part of `chrome.storage.local` used here. */
export interface KeyValueStorage {
  get(keys: string | string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export const LAST_GOOD_KEY = "settings.lastGood";
export const LAST_ATTEMPT_KEY = "settings.lastAttemptAt";

/** The last good copy as stored: the file as fetched, and when. */
export interface StoredSettings {
  raw: unknown;
  fetchedAt: number;
}

export type SettingsOrigin = "fetched" | "default";

export interface EffectiveSettings {
  settings: Settings;
  origin: SettingsOrigin;
  /** When the copy in effect was fetched; null for the built-in default. */
  fetchedAt: number | null;
}

/** The built-in default. It is valid by construction (a test checks it). */
export function defaultSettings(): Settings {
  const { settings } = validateSettings(DEFAULT_CONFIG);
  if (!settings) throw new Error("the bundled default settings are not valid");
  return settings;
}

/** The settings in effect: the last good copy, or the built-in default. */
export async function readEffectiveSettings(storage: KeyValueStorage): Promise<EffectiveSettings> {
  const stored = (await storage.get(LAST_GOOD_KEY))[LAST_GOOD_KEY] as StoredSettings | undefined;
  if (stored && typeof stored === "object" && typeof stored.fetchedAt === "number") {
    // Validated again on every read: a copy stored by an older version is held to today's rules.
    const { settings } = validateSettings(stored.raw);
    if (settings) return { settings, origin: "fetched", fetchedAt: stored.fetchedAt };
  }
  return { settings: defaultSettings(), origin: "default", fetchedAt: null };
}

export type RefreshOutcome =
  | { kind: "skipped" }
  | { kind: "updated"; problems: string[] }
  | { kind: "kept"; reason: string };

export interface RefreshOptions {
  fetch: typeof fetch;
  now: () => number;
  /** Fetch even when the last attempt is less than an hour old (start-up). */
  force?: boolean;
  /** The settings file's address; default SETTINGS_URL. Null: nothing is fetched. */
  url?: string | null;
  timeoutMs?: number;
}

/**
 * Fetch the settings file when it is due, and keep it when it is usable. The attempt is recorded
 * before the request, so a burst of callers makes one request.
 */
export async function refreshSettings(storage: KeyValueStorage, options: RefreshOptions): Promise<RefreshOutcome> {
  const url = options.url === undefined ? SETTINGS_URL : options.url;
  // A build with no settings address uses its bundled copy only, and never fetches.
  if (url === null) return { kind: "skipped" };
  const now = options.now();
  if (!options.force) {
    const last = (await storage.get(LAST_ATTEMPT_KEY))[LAST_ATTEMPT_KEY];
    if (typeof last === "number" && now - last < SETTINGS_REFRESH_MS && now >= last) return { kind: "skipped" };
  }
  await storage.set({ [LAST_ATTEMPT_KEY]: now });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);
  let raw: unknown;
  try {
    const response = await options.fetch(url, {
      signal: controller.signal,
      cache: "no-cache",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) return { kind: "kept", reason: `HTTP ${response.status}` };
    raw = JSON.parse(await response.text());
  } catch (error) {
    return { kind: "kept", reason: error instanceof SyntaxError ? "malformed JSON" : `unreachable (${String(error)})` };
  } finally {
    clearTimeout(timer);
  }
  const { settings, problems } = validateSettings(raw);
  if (!settings) return { kind: "kept", reason: problems.join("; ") };
  const stored: StoredSettings = { raw, fetchedAt: options.now() };
  await storage.set({ [LAST_GOOD_KEY]: stored });
  return { kind: "updated", problems };
}
