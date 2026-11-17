// SPDX-License-Identifier: Apache-2.0
// The background: it fetches the settings file at start-up, and again when a page of the
// extension asks and the last attempt is an hour old or more. It makes no other request, and
// none at all when the build has no settings address (duelsight.config.json settingsUrl null).
// When the extension is installed or updated, it removes the stored entries of features that
// are gone (src/shared/retired.ts).

import { createSettingsCore } from "../../vendor/cardvision-browser/host-settings.js";
import { SETTINGS_SCHEMA } from "../settings/store.js";
import { removeRetired } from "../shared/retired.js";

const settings = createSettingsCore(SETTINGS_SCHEMA, chrome.storage.local);
const refresh = (force: boolean): Promise<unknown> =>
  settings.refresh({ fetch: (...args) => fetch(...args), now: () => Date.now(), force }).catch(() => undefined);

chrome.runtime.onInstalled.addListener(() => {
  void removeRetired(chrome.storage.local as never).catch(() => undefined);
  void refresh(true);
});
chrome.runtime.onStartup.addListener(() => void refresh(true));

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // Only the extension's own pages and frames ask.
  if (sender.id !== chrome.runtime.id) return false;
  if (typeof message !== "object" || message === null || (message as { kind?: unknown }).kind !== "settings:refresh") return false;
  void refresh(false).then(() => sendResponse({ ok: true }));
  return true;
});
