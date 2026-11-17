// SPDX-License-Identifier: Apache-2.0
// Where the settings in effect come from (SETTINGS.md, "Failure rules"). The rules are the toolkit
// shared hover host's settings core (`createSettingsCore`); DuelSight gives it its schema, its
// built-in default and its address (SETTINGS_SCHEMA), and each part of the extension makes its
// own core from its own host file: the background, the popup and the tooltip frame from
// host-settings.js, the compute frame from host-compute.js.
//
//   - The settings file is fetched at start-up, then at most once an hour while the extension
//     runs (`refresh`, called by the background on start-up and whenever a page asks).
//   - A usable file replaces the last good copy, kept in extension storage with the time it
//     was fetched (`settings.lastGood`); `settings.lastAttemptAt` records each attempt.
//   - Anything else (unreachable, non-2xx, malformed JSON, schemaVersion other than 1, a required
//     field missing or of the wrong type) keeps the last good copy; with none, the built-in
//     default, a copy of the shipped config.json. The copy is validated again on every read.

import { SETTINGS_URL } from "../constants.js";
// The built-in default is the published settings file itself (single source: cdn/config.json).
import DEFAULT_CONFIG from "../../cdn/config.json";
import { validateSettings } from "./schema.js";

/** The part of `chrome.storage.local` the extension uses. */
export interface KeyValueStorage {
  get(keys: string | string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** DuelSight's settings for the host's settings core: the schema check, the built-in default
 *  (it is valid by construction; a test checks it), and the address (null: nothing is fetched). */
export const SETTINGS_SCHEMA = {
  validate: (raw: unknown) => validateSettings(raw),
  defaultRaw: DEFAULT_CONFIG as unknown,
  url: SETTINGS_URL,
};
