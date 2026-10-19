// SPDX-License-Identifier: Apache-2.0
// The background: it fetches the settings file at start-up, and again when a page of the
// extension asks and the last attempt is an hour old or more. It makes no other request, and
// none at all when the build has no settings address (kenbunshoku.config.json settingsUrl null).

import { refreshSettings } from "../settings/store.js";

const refresh = (force: boolean): Promise<unknown> =>
  refreshSettings(chrome.storage.local, { fetch: (...args) => fetch(...args), now: () => Date.now(), force }).catch(() => undefined);

chrome.runtime.onInstalled.addListener(() => void refresh(true));
chrome.runtime.onStartup.addListener(() => void refresh(true));

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // Only the extension's own pages and frames ask.
  if (sender.id !== chrome.runtime.id) return false;
  if (typeof message !== "object" || message === null || (message as { kind?: unknown }).kind !== "settings:refresh") return false;
  void refresh(false).then(() => sendResponse({ ok: true }));
  return true;
});
